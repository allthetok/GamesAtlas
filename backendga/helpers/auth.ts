import bcrypt from 'bcrypt'

const hashPassword = async (saltRounds: number, unencryptedPass: string) => {
	const hashPass: string = await bcrypt.hash(unencryptedPass, saltRounds)
	return hashPass
}

const authPassword = async (unencryptedPass: string, hashPass: string) => await bcrypt.compare(unencryptedPass, hashPass)

export { hashPassword, authPassword }