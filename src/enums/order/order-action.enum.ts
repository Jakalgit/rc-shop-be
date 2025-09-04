
export enum OrderActionEnum {
  CREATE = "create", // Заказ создан,
  UPDATE = "update", // Изменены общие данные заказа (например, адрес или контакты)
  CANCEL = "cancel", // Заказ отменён (покупателем, админом или системой)
  RESTORE = "restore", // Восстановление отменённого заказа
  DELETE = "delete", // Заказ удален
}