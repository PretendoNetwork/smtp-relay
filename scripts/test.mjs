import { createTransport } from 'nodemailer';

async function main() {
	const transporter = createTransport({
		host: '127.0.0.1',
		port: 2525,
		secure: false,
		auth: {
			user: 'foo',
			pass: 'bar'
		}
	});

	const info = await transporter.sendMail({
		from: '"Test Sender" <test@example.com>',
		to: '12345@invalid.com',
		subject: 'Hello world!',
		text: 'Hello world?',
		html: '<b>Hello world?</b>'
	});

	console.log('Message sent: ', info.messageId);
}

main().catch(console.error);
