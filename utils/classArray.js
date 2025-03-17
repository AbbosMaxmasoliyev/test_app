const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const {User} = require("../models/User"); // User modelini import qilish

// MongoDB ulanishi
mongoose.connect("mongodb+srv://abbos:zPS4yWZIsges947f@cluster0.adosdaq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Parolni yangilash funksiyasi
async function updatePasswords() {
    try {
        // Barcha studentlarni olish
        const students = await User.find({role:"student"});

        if (students.length === 0) {
            console.log("Hech qanday student topilmadi.");
            return;
        }

        // Har bir student uchun parolni yangilash
        for (let student of students) {
            const newPassword = student.password; // Yangi parol
            const hashedPassword = await bcrypt.hash(newPassword, 10); // Hash qilish

            // Yangilangan parolni saqlash
            await User.updateOne({ _id: student._id }, { password: hashedPassword });

            console.log(`Student ${student.name} uchun parol yangilandi.`);
        }

        console.log("Barcha studentlarning paroli muvaffaqiyatli yangilandi!");
        mongoose.connection.close();
    } catch (error) {
        console.error("Xatolik yuz berdi:", error);
    }
}

// Funksiyani ishga tushirish
updatePasswords();
