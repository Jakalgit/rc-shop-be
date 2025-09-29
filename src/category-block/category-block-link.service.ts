import { Injectable } from "@nestjs/common";
import { LinkBlockDto } from "./dto/update-category-block.dto";
import { Op, Transaction } from "sequelize";
import { CategoryLink } from "./models/category-link.model";
import { InjectModel } from "@nestjs/sequelize";

@Injectable()
export class CategoryBlockLinkService {

  constructor(
    @InjectModel(CategoryLink)
    private readonly categoryLinkRepository: typeof CategoryLink
  ) {}

  async updateLinks(links: LinkBlockDto[], transaction: Transaction) {
    // Проверяем данные

    // Удаляем данные которых нет в dto
    await this.deleteLinks(links, transaction);

    // Обновляем существующие ссылки
    await this.updateExistLinks(links, transaction);

    // Выделяем только те ссылки которые привязаны к уже существующему блоку
    links = links.filter(el => el.categoryBlockId > 0);
    // Создаем новые ссылки
    await this.createNewLinks(links, transaction);
  }

  private async checkDtoBlockLinksData() {

  }

  private async deleteLinks(links: LinkBlockDto[], transaction: Transaction) {
    // Получаем все ссылки
    const allLinks = await this.categoryLinkRepository.findAll({raw: true});
    // Находим ссылки, которых нет в обновлённых данных - их надо удалить
    const linksToDelete = allLinks.filter(el => !links.find(n => n.id === el.id));
    // Получаем id ссылок
    const linkIds = linksToDelete.map(el => el.id);

    if (linkIds.length > 0) {
      await this.categoryLinkRepository.destroy({
        where: {
          id: { [Op.or]: linkIds }
        },
        transaction,
      });
    }
  }

  private async updateExistLinks(links: LinkBlockDto[], transaction: Transaction) {
    const promises: Promise<any>[] = [];

    for (const link of links) {
      if (link.id > 0) {
        const data = {
          link: link.link,
          linkText: link.linkText,
          categoryBlockId: link.categoryBlockId,
          index: link.index,
        }

        promises.push(
          this.categoryLinkRepository.update(data, {where: {id: link.id}, transaction})
        )
      }
    }

    await Promise.all(promises);
  }

  async createNewLinks(links: LinkBlockDto[], transaction: Transaction) {
    const newLinks = links.filter(el => el.id < 0);

    if (newLinks.length === 0) {
      return;
    }

    const linksBulkCreate = newLinks.map(el => ({
      linkText: el.linkText,
      link: el.link,
      index: el.index,
      categoryBlockId: el.categoryBlockId,
    }));

    await this.categoryLinkRepository.bulkCreate(linksBulkCreate, {transaction});
  }
}