import bcrypt from 'bcrypt'

export const hashPassword = async (password)=>{
    try {
        const salt=10;
        const hashed=await bcrypt.hash(password,salt)
        return hashed
    } catch (error) {
        throw new Error('Password Hash failed')
    }
}

export const comparePassword= async (password,hashed)=>{
    return await bcrypt.compare(password,hashed)
}