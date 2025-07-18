import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Tag } from "./models/tag.model";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { Group } from "./models/group.model";
import { CreateGroupDto } from "./dto/create-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";
import { Op, Transaction } from "sequelize";
import { TagProduct } from "./models/tag-product.model";
import { defaultTags, promotionTag } from "../consts/default-tags";

@Injectable()
export class TagService implements OnModuleInit {

  constructor(
    @InjectModel(Tag)
    private readonly tagRepository: typeof Tag,
    @InjectModel(Group)
    private readonly groupRepository: typeof Group,
    @InjectModel(TagProduct)
    private readonly tagProductRepository: typeof TagProduct,
  ) {
  }

  async onModuleInit(): Promise<void> {
    const tags = await this.tagRepository.findAll({
      where: {
        name: {
          [Op.or]: defaultTags,
        }
      }
    });

    if (tags.length !== 3) {
      const bulkCreateAttrs = defaultTags.map(el => {
        return {
          name: el
        }
      })
      await this.tagRepository.bulkCreate(bulkCreateAttrs);
    }
  }

  // Создание нового тега
  // Для администратора
  async createTag(dto: CreateTagDto) {
    const candidate = await this.tagRepository.findOne({ where: {name: dto.name}, raw: true });

    if (candidate) {
      throw new BadRequestException("Tag with such name already exists");
    }

    return (await this.tagRepository.create(dto)).dataValues;
  }

  // Обновление тега
  // Для администратора
  async updateTag(dto: UpdateTagDto) {
    const [tag, candidate] = await Promise.all([
      this.tagRepository.findOne({where: {id: dto.id}}),
      this.tagRepository.findOne({where: {name: dto.name, id: {[Op.notIn]: [dto.id]}}})
    ]);

    if (typeof dto.groupId === 'number') {
      const group = await this.groupRepository.findOne({where: {id: dto.groupId}, raw: true});
      if (!group) {
        throw new BadRequestException("Group with such id doesn't exist");
      }
    }

    if (!tag) {
      throw new BadRequestException("Tag with such id doesn't exist");
    }

    if (candidate) {
      throw new BadRequestException("Tag with such name already exists");
    }

    await tag.update(dto);
  }

  // Удаление тега
  // Для администратора
  async deleteTag(identifier: number | string) {
    if (Number.isNaN(+identifier)) {
      await this.tagRepository.destroy({ where: { name: identifier } });
    } else {
      await this.tagRepository.destroy({ where: { id: identifier } });
    }
  }

  // Создание группы
  // Для администратора
  async createGroup(dto: CreateGroupDto) {
    const candidate = await this.groupRepository.findOne({where: {name: dto.name}, raw: true });

    if (candidate) {
      throw new BadRequestException("Group with such name already exists");
    }

    return await this.groupRepository.create(dto);
  }

  // Изменение группы
  async updateGroup(dto: UpdateGroupDto) {
    const [group, candidate] = await Promise.all([
      await this.groupRepository.findOne({ where: {id: dto.id}}),
      await this.groupRepository.findOne({ where: {name: dto.name, id: {[Op.notIn]: dto.id}}}),
    ]);

    if (!group) {
      throw new BadRequestException("Group with such id doesn't exist");
    }

    if (candidate) {
      throw new BadRequestException("Group with such name already exists");
    }

    await group.update(dto);
  }

  // Удаление группы
  // Для администратора
  async deleteGroup(identifier: number | string) {
    if (Number.isNaN(+identifier)) {
      await this.groupRepository.destroy({ where: { name: identifier } });
    } else {
      await this.groupRepository.destroy({ where: { id: identifier } });
    }
  }

  // Получение всех групп
  // Для администратора
  async getAllGroups() {
    const groups = await this.groupRepository.findAll({ raw: true });
    const tags = await this.tagRepository.findAll({
      where: {
        groupId: {
          [Op.or]: groups.map(el => el.id),
        }
      },
      raw: true,
    });

    return groups.map(group => {
      return {
        ...group,
        tags: tags.filter(el => el.groupId === group.id),
      }
    });
  }

  // Получение всех тегов для заданной группы
  // Или просто всех тегов
  // Для администратора
  async getAllTags(groupId?: number) {
    if (groupId) {
      return this.tagRepository.findAll({ where: { groupId }, raw: true });
    } else {
      return this.tagRepository.findAll({ raw: true });
    }
  }

  // Получение тегов для фильтра товаров
  async getAllUserTags() {
    const [tags, groups] = await Promise.all([
      this.tagRepository.findAll({ raw: true }),
      this.groupRepository.findAll({ raw: true })
    ]);

    // Все существующие теги
    const listOfTags = [...tags];

    // Все теги без принадлежности к группе
    const tagsWithoutGroup = tags.filter(el => !el.groupId);

    // Все группы с их тегами, если у группы нет тега, то её не отображаем
    const listOfGroups = groups.map(el => {
      const tagsWithThisGroup = tags.filter(t => t.groupId === el.id);
      if (tagsWithThisGroup.length > 0) {
        return {
          name: el.name,
          tags: tagsWithThisGroup,
        }
      }
    }).filter(Boolean);

    return {
      listOfTags,
      listOfGroups,
      tagsWithoutGroup,
    }
  }

  // Обновление связей с тегом "Акции" для продукта
  async updatePromotionForProduct(
    {productId, transaction, toCreate}:
    {productId: number, transaction?: Transaction, toCreate: boolean}
  ) {
    let tag = await this.tagRepository.findOne({
      where: {
        name: promotionTag
      },
      raw: true
    });

    if (!tag) {
      tag = (await this.tagRepository.create(promotionTag, {transaction})).dataValues;
    }

    const connection = await this.tagProductRepository.findOne({
      where: {
        tagId: tag.id,
        productId
      },
      transaction
    })

    if (toCreate) {
      if (!connection) {
        await this.tagProductRepository.create({productId, tagId: tag.id}, {transaction});
      }
    } else if (connection) {
      await connection.destroy({transaction});
    }
  }

  // Создание связей TagProduct для продукта и заданных тегов
  async connectTagsToProduct(
    {tagIds, productId, transaction = null}:
    {tagIds: number[], productId: number, transaction?: Transaction}
  ) {

    if (tagIds.length === 0) {
      await this.tagProductRepository.destroy({
        where: {
          productId
        },
        transaction
      });
    } else {
      const [tags, existingTagsConnection] = await Promise.all([
        // Ищем теги с заданными id
        await this.tagRepository.findAll({
          where: {
            id: { [Op.or]: tagIds },
          },
          raw: true,
        }),
        // Ищем существующие связи между тегами и продуктом
        this.tagProductRepository.findAll({
          where: {
            productId: productId,
            tagId: { [Op.or]: tagIds }
          },
          raw: true,
        })
      ]);

      // Проверяем все ли теги из tagIds существую в бд
      if (tagIds.find(id => !tags.find(tag => tag.id === id))) {
        throw new BadRequestException("Some of tags in request doesn't exist");
      }

      // Оставляем только те id, для которых связи TagProduct не существует
      const filteredTagIds = tagIds.filter(id => !existingTagsConnection.find(t => t.tagId === id));

      // Собираем массив данных для создания связей
      const tagProductBulkCreateAttrs = filteredTagIds.map(el => {
        return {
          tagId: el,
          productId,
        }
      });

      await Promise.all([
        // Удаляем все старые связи с этим продуктом
        this.tagProductRepository.destroy({
          where: {
            productId,
            ...(tagIds.length > 0 ? {tagId: { [Op.notIn]: tagIds }} : {})
          },
          transaction
        }),
        // Создаем новые связи
        this.tagProductRepository.bulkCreate(tagProductBulkCreateAttrs, {transaction})
      ]);
    }
  }

  // Получение id продуктов которые использую указанные теги
  async getProductIdsForTagIds(tagIds: number[]) {
    const connections = await this.tagProductRepository.findAll({
      where: {
        tagId: { [Op.or]: tagIds },
      },
      raw: true,
    });

    return connections.map(el => el.productId);
  }

  // Получение тегов по группам для пользователей
  async getTagsForProducts(productIds: number[]) {
    const tagProductConnections = await this.tagProductRepository.findAll({
      where: {productId: { [Op.or]: productIds }, },
      raw: true,
    });

    const tagIds = tagProductConnections.map(el => el.tagId);

    if (tagIds.length > 0) {
      const tags = await this.tagRepository.findAll({
        where: { id: { [Op.or]: tagIds }, },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        raw: true,
      });
      return tags.map(tag => {
        return {
          ...tag,
          productIds: tagProductConnections.filter(el => el.tagId === tag.id).map(el => el.productId),
        }
      })
    } else {
      return [];
    }
  }
}
