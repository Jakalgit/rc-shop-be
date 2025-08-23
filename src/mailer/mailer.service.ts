import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from "@nestjs/config";
import * as fs from 'fs-extra';
import * as handlebars from 'handlebars';
import { join } from 'path';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT') || 587,
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },

    });
  }

  private async compileTemplate(templateName: string, context: any): Promise<string> {
    const templatePath = join(__dirname, '..', 'templates', 'email', `${templateName}.hbs`);
    const templateFile = fs.readFileSync(templatePath, 'utf-8');
    const compiled = handlebars.compile(templateFile);
    return compiled(context);
  }

  async sendMail(
    { to, subject, template, context, text }:
    { to: string, subject: string, template?: string, context?: any, text?: string }
  ) {
    let html: string | undefined;

    if (template) {
      html = await this.compileTemplate(template, context || {});
    }

    const mailOptions = {
      from: `"WORK-RC" <${this.configService.get('SMTP_USER')}>`,
      to,
      subject,
      text,
      html,
    };

    await this.transporter.sendMail(mailOptions);
  }

}
