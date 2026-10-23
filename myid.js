const db = require('../database');

module.exports = (bot) => {
    bot.command('addbalance', async (ctx) => {
        const ADMIN_ID = process.env.ADMIN_ID; // Lấy ID admin từ file .env
        
        // Kiểm tra quyền Admin
        if (ctx.from.id.toString() !== ADMIN_ID.toString()) {
            return ctx.reply('❌ Bạn không có quyền sử dụng lệnh này!');
        }

        // Tách phần ID khách và số tiền từ tin nhắn
        const args = ctx.message.text.split(' ');
        if (args.length < 3) {
            return ctx.reply('⚠️ Cú pháp đúng: /addbalance [ID_Khách] [Số_tiền]\nVí dụ: /addbalance 6143675188 50000');
        }

        const userId = args[1];
        const amount = parseInt(args[2]);

        if (isNaN(amount) || amount <= 0) {
            return ctx.reply('❌ Số tiền nhập vào không hợp lệ!');
        }

        try {
            // Tìm xem người dùng có tồn tại trong hệ thống bot không (Sửa thành telegram_id)
            const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(userId);
            if (!user) {
                return ctx.reply('❌ Không tìm thấy người dùng này trong hệ thống bot!');
            }

            // Cập nhật số dư cộng thêm tiền (Sửa thành telegram_id)
            db.prepare('UPDATE users SET balance = balance + ? WHERE telegram_id = ?').run(amount, userId);

            // Gửi thông báo xác nhận cho Admin
            await ctx.reply(`✅ Đã nạp thành công ${amount.toLocaleString()}đ cho khách hàng:\n👤 ID: ${userId}\n💰 Số dư mới: ${(user.balance + amount).toLocaleString()}đ`);

            // Tự động nhắn tin báo cho khách hàng biết họ đã được cộng tiền thành công
            await ctx.telegram.sendMessage(userId, `🎉 Tài khoản của bạn đã được Admin cộng thêm *${amount.toLocaleString()}đ* bằng phương thức thủ công.\n💰 Số dư hiện tại của bạn: ${(user.balance + amount).toLocaleString()}đ`, { parse_mode: 'Markdown' });

        } catch (error) {
            console.error(error);
            ctx.reply('❌ Có lỗi xảy ra khi cập nhật số dư vào cơ sở dữ liệu!');
        }
    });
};
