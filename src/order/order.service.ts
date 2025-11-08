import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from './models/order.model';
import { OrderItem, OrderItemCreationAttrs } from './models/order_item.model';
import { OrderAction } from './models/order_action.model';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProfileGettersService } from '../profile/services/profile-getters.service';
import { ProductService } from '../product/services/product.service';
import { ProfileEnum } from '../enums/profile.enum';
import { DeliveryMethodEnum } from '../enums/order/delivery-method.enum';
import { Sequelize } from 'sequelize-typescript';
import { OrderActionEnum } from '../enums/order/order-action.enum';
import { OrderActionActorEnum } from '../enums/order/order-action-actor.enum';
import * as generatePassword from 'generate-password';
import { Op, Transaction } from 'sequelize';
import { ProductHelpersService } from '../product/services/product-helpers.service';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderHelpersService } from './order-helpers.service';
import { OrderStatusEnum } from '../enums/order/order-status.enum';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '../mailer/mailer.service';
import { PaymentMethodEnum } from '../enums/order/payment-method.enum';
import ISOLATION_LEVELS = Transaction.ISOLATION_LEVELS;

@Injectable()
export class OrderService {
  private readonly MAIN_HOST: string;

  constructor(
    @InjectModel(Order)
    private readonly orderRepository: typeof Order,
    @InjectModel(OrderItem)
    private readonly orderItemRepository: typeof OrderItem,
    @InjectModel(OrderAction)
    private readonly orderActionRepository: typeof OrderAction,
    private readonly profileGettersService: ProfileGettersService,
    private readonly productService: ProductService,
    private readonly productHelpersService: ProductHelpersService,
    private readonly orderHelpersService: OrderHelpersService,
    private readonly mailerService: MailerService,
    private readonly sequelize: Sequelize,
    private readonly configService: ConfigService,
  ) {
    this.MAIN_HOST = configService.get<string>('MAIN_HOST');
  }

  private checkOrderValues(dto: CreateOrderDto) {
    // TODO: Добавить другие проверки значений

    if (
      dto.deliveryMethod !== DeliveryMethodEnum.SELF_PICKUP &&
      dto.paymentMethod === PaymentMethodEnum.CASH_ON_DELIVERY
    ) {
      throw new BadRequestException(
        'Для оплаты наличными выберите способ доставки "Самовывоз"',
      );
    }
  }

  async create(dto: CreateOrderDto, profileId?: string) {
    // Находим профиль пользователя
    const profile =
      profileId && (await this.profileGettersService.getProfile(profileId));
    // Если профиля не существует
    if (!profile && typeof profileId === 'string' && profileId.length === 36) {
      throw new NotFoundException('Пользователя с таким id не существует');
    }

    // Получаем артикли товаров из запроса
    const articles = dto.items.map((el) => el.article);
    // Получаем продукты из базы данных
    const products = await this.productService.getProductForBasket(
      articles,
      profile?.type === ProfileEnum.PARTNER,
    );
    // Получаем артикли товаров, найденных в базе данных
    const productArticles = new Set(products.map((p) => p.article));
    const productIds = products.map((p) => p.id);

    // TODO: Добавить проверку на кол-во заказываемого товара

    this.checkOrderValues(dto);

    if (articles.some((article) => !productArticles.has(article))) {
      throw new BadRequestException(
        'К сожалению, некоторые из товаров в вашей корзине закончились на складе. ' +
          'Возможно, их выкупили пока вы заполняли данные. ' +
          'Доступные для покупки товары можно увидеть в корзине или нажав кнопку "Посмотреть товары".',
      );
    }

    if (
      dto.deliveryMethod !== DeliveryMethodEnum.SELF_PICKUP &&
      typeof dto.address !== 'string'
    ) {
      throw new BadRequestException(
        'Укажите адрес доставки или выберите тип доставки: самовывоз',
      );
    }

    // Считаем цену товаров
    const subtotal = products.reduce(
      (acc: number, value) => acc + value.price,
      0,
    );

    const transaction = await this.sequelize.transaction({
      isolationLevel: ISOLATION_LEVELS.SERIALIZABLE,
    });
    try {
      // Создаем заказ
      const orderNumber =
        'ORD-' +
        generatePassword.generate({
          length: 15,
          lowercase: false,
          numbers: true,
          symbols: false,
          uppercase: false,
          strict: false,
        });
      const order = await this.orderRepository.create(
        {
          guestName: `${dto.surname} ${dto.name} ${dto.patronymic}`,
          guestEmail: dto.email,
          guestPhone: dto.phone,
          deliveryMethod: dto.deliveryMethod,
          paymentMethod: dto.paymentMethod,
          subtotal,
          orderNumber,
          comment: dto.comment,
          ...(dto.deliveryMethod !== DeliveryMethodEnum.SELF_PICKUP
            ? { address: dto.address }
            : {}),
          ...(profile ? { profileId } : {}),
        },
        { transaction },
      );

      // Готовим данные для создания товаров в заказе
      const orderItemsBulkAttrs: OrderItemCreationAttrs[] = products.map(
        (product) => {
          const quantity = dto.items.find(
            (el) => el.article === product.article,
          ).qty;
          return {
            quantity,
            name: product.name,
            article: product.article,
            orderId: order.dataValues.id,
            price: product.price,
            productId: product.id,
          };
        },
      );

      await Promise.all([
        this.productHelpersService.decrementCount('count', {
          where: { id: { [Op.or]: productIds }, count: { [Op.gt]: 0 } },
        }),
        // Создаем товары к заказу
        this.orderItemRepository.bulkCreate(orderItemsBulkAttrs, {
          transaction,
        }),
        // Создаем лог действия с заказом
        this.orderActionRepository.create(
          {
            actionType: OrderActionEnum.CREATE,
            actorType: OrderActionActorEnum.USER,
            comment: 'New order created from client',
            orderId: order.dataValues.id,
          },
          { transaction },
        ),
      ]);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateOrderInfo(dto: UpdateOrderDto) {
    const order = await this.orderRepository.findOne({
      where: { orderNumber: dto.orderNumber },
      raw: true,
    });

    if (!order) {
      throw new BadRequestException('Заказ с таким ID не найден в базе данных');
    }

    const differentFields = Object.keys(dto)
      .map((key) => {
        if (dto[key] !== order[key]) {
          return key;
        }
      })
      .filter(Boolean);

    if (differentFields.length === 0) return;

    const newFieldValues = this.orderHelpersService.pick(dto, differentFields);
    const oldFieldValues = this.orderHelpersService.pick(
      order,
      differentFields,
    );

    if (
      differentFields.includes('status') &&
      order.status === OrderStatusEnum.PENDING &&
      dto.status === OrderStatusEnum.CONFIRMED
    ) {
      await this.mailerService.sendMail({
        to: dto.guestEmail || order.guestEmail,
        subject: 'Обновление статуса заказа',
        template: 'confirm-order',
        context: {
          customerName: order.guestName,
          orderNumber: order.orderNumber,
          orderUrl: `${this.MAIN_HOST}/order/${dto.orderNumber}`,
          orderDate: new Date(order.createdAt).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          orderTotal:
            order.subtotal.toLocaleString('ru-RU', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) + ' ₽',
          orderStatus: 'Подтверждён',
        },
      });
    }

    const transaction = await this.sequelize.transaction();

    try {
      await Promise.all([
        this.orderRepository.update(newFieldValues, {
          where: { orderNumber: dto.orderNumber },
          transaction,
        }),
        this.orderActionRepository.create(
          {
            actionType: OrderActionEnum.UPDATE,
            actorType: OrderActionActorEnum.ADMIN,
            comment: dto.actionComment,
            orderId: order.id,
            newValue: JSON.stringify(newFieldValues),
            oldValue: JSON.stringify(oldFieldValues),
          },
          { transaction },
        ),
      ]);

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      console.error(e);
      throw e;
    }
  }

  async getAllOrders(page: number = 1, limit: number = 24) {
    const orders = await this.orderRepository.findAndCountAll({
      limit,
      offset: (page - 1) * limit,
      raw: true,
      order: [['createdAt', 'DESC']],
    });

    // Общее количество записей
    const totalRecords = orders.count;

    // Общее количество страниц
    const totalPages = Math.ceil(totalRecords / limit);

    // Полученные записи
    const orderRecords = orders.rows;

    const ordersData = await this.collectDataForOrders(orderRecords, true);

    return {
      records: ordersData,
      totalPages,
    };
  }

  async getOrderByNumber(orderNumber: string, isAdmin: boolean = false) {
    const excludeFields = isAdmin
      ? []
      : ['ipAddress', 'userAgent', 'transactionId', 'profileId'];

    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      raw: true,
      attributes: {
        exclude: excludeFields,
      },
    });

    if (!order) {
      throw new NotFoundException('Заказ с указанным номером не найден');
    }

    const result = await this.collectDataForOrders([order], isAdmin);
    return result[0];
  }

  async getOrdersByProfileId(
    profileId: string,
    page: number = 1,
    limit: number = 1,
  ) {
    const orders = await this.orderRepository.findAndCountAll({
      where: { profileId },
      raw: true,
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    });

    // Общее количество записей
    const totalRecords = orders.count;

    // Общее количество страниц
    const totalPages = Math.ceil(totalRecords / limit);

    // Полученные записи
    const orderRecords = orders.rows;

    if (orderRecords.length !== 0) {
      const ordersData = await this.collectDataForOrders(orderRecords, false);
      return {
        records: ordersData,
        totalPages,
      };
    } else {
      return {
        records: [],
        totalPages: 1,
      };
    }
  }

  async collectDataForOrders(orders: Order[], isAdmin: boolean) {
    const orderIds = orders.map((order) => order.id);
    const orderItems = await this.orderItemRepository.findAll({
      where: {
        orderId: { [Op.or]: orderIds },
      },
    });

    let orderActivities = [];
    if (isAdmin) {
      orderActivities = await this.orderActionRepository.findAll({
        where: {
          orderId: { [Op.or]: orderIds },
        },
      });
    }

    return orders.map((order) => {
      return {
        ...order,
        items: orderItems.filter((el) => el.orderId === order.id),
        activities: orderActivities.filter((el) => el.orderId === order.id),
      };
    });
  }
}
