import { IsEmail, IsNotEmpty, IsPhoneNumber, MaxLength, MinLength } from "class-validator";

export class CreatePartnerDto {

  @IsNotEmpty({message: "Name cannot be empty"})
  name: string;

  @IsNotEmpty({message: "Phone cannot be empty"})
  @IsPhoneNumber("RU", {message: "Incorrect phone number format"})
  phone: string;

  @IsNotEmpty({message: "Email cannot be empty"})
  @IsEmail({}, {message: "Incorrect email format"})
  email: string;

  @MinLength(10, {message: "The name of the organization must be at least 50 characters long"})
  @MaxLength(90, {message: "The name of the organization must be no more than 500 characters long"})
  organization: string;

  @MinLength(50, {message: "The description of the activity must be at least 50 characters long"})
  @MaxLength(500, {message: "The description of the activity must be no more than 500 characters long"})
  descriptionOfActivities: string;
}