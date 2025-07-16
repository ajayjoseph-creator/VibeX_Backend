import mongoose from "mongoose";

const connectDB=async ()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('DataBase Connected')
    } catch (error) {
        console.log('Something error in the DataBase Connection',error)
    }
}
export default connectDB;