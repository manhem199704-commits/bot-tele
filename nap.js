const paymentService = require('../services/paymentService');
const messages = require('../utils/messages');
const { formatPrice } = require('../utils/keyboard');
const config = require('../config');

module.exports = (bot) => {
    bot.command('nap', async (ctx) => {
        const text = ctx.message.text.split(' ');
        if (text.length < 2 || isNaN(text[1])) {
            return ctx.replyWithHTML(
                '💰 <b>NẠP SỐ DƯ</b>\n\n' +
                'Cách dùng: /nap [số tiền]\n' +
                'Ví dụ: /nap 50000\n\n' +
                '💡 Số tiền tối thiểu: 10.000đ'
            );
        }

        const amount = parseInt(text[1]);
        if (amount < 10000) {
            return ctx.reply('❌ Số tiền tối thiểu là 10.000đ');
        }

        const payment = paymentService.generatePayment(amount);
        const user = ctx.from;

        // 1. Gửi thông tin chuyển khoản cho Khách
        await ctx.replyWithHTML(
            `💰 <b>NẠP SỐ DƯ</b>\n\n` +
            `├ <b>Số tiền:</b> <code>${formatPrice(amount)}</code>\n` +
            `└ <b>Nội dung CK:</b> <code>${payment.paymentCode}</code>\n\n` +
            `📌 <b>Mã QR Thanh Toán:</b>\n${payment.qrUrl}\n\n` +
            `⌛ <i>Vui lòng chuyển đúng nội dung. Admin sẽ duyệt và cộng số dư cho bạn!</i>`
        );

        // 2. Gửi thông báo báo đơn nạp về riêng cho ADMIN
        if (config.ADMIN_ID) {
            try {
                const adminMsg = 
                    `🔔 <b>YÊU CẦU NẠP TIỀN MỚI!</b>\n\n` +
                    `👤 <b>Khách hàng:</b> ${user.first_name} ${user.last_name || ''} (@${user.username || 'không_có'})\n` +
                    `🆔 <b>ID Telegram:</b> <code>${user.id}</code>\n` +
                    `💵 <b>Số tiền nạp:</b> <code>${formatPrice(amount)}</code>\n` +
                    `📝 <b>Nội dung CK:</b> <code>${payment.paymentCode}</code>\n\n` +
                    `👉 <b>Lệnh cộng tiền nhanh:</b>\n` +
                    `<code>/addbalance ${user.id} ${amount}</code>`;

                await bot.telegram.sendMessage(config.ADMIN_ID, adminMsg, { parse_mode: 'HTML' });
            } catch (err) {
                console.error('Lỗi gửi thông báo cho Admin:', err.message);
            }
        }
    });
};