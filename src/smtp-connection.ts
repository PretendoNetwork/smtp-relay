import { createTransport } from 'nodemailer';
import { config } from './config';
import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

export function getTransporter() {
	if (!transporter) {
		throw new Error('Transporter not initialized');
	}
	return transporter;
}

export function initSmtpConnection() {
	transporter = createTransport({
		host: config.smtp.host,
		port: config.smtp.port,
		secure: config.smtp.secure,
		auth: {
			user: config.smtp.username,
			pass: config.smtp.password
		}
	});
}
