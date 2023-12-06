const transport = {
	host: 'smtp-relay.brevo.com',
	port: 587,
	secure: false,
	auth: {
		user: process.env.SMTP_FROM_EMAIL,
		pass: process.env.SMTP_TO_PASSWORD,
	},
	// tls: {
	//     ciphers:'SSLv3'
	// }
}

const generateVerificationCode = (): number => Math.floor(1000000*Math.random())


export { transport, generateVerificationCode }