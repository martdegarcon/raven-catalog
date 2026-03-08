import payload from 'payload';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET || '',
    mongoURL: process.env.MONGODB_URI || '', // если SQLite, не трогать, Payload сам подхватит DATABASE_URL
    local: true, // запускаем в режиме dev
  });

  const adminEmail = 'newadmin@example.com';   // Email нового админа
  const adminPassword = 'NewStrongPass123!';   // Пароль нового админа

  // 1️⃣ Снимаем блокировку у старого пользователя
  const oldUser = await payload.find({
    collection: 'users',
    where: { email: { equals: 'miefrzevv@gmail.com' } },
  });

  if (oldUser.totalDocs > 0) {
    const userId = oldUser.docs[0].id;
    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        loginAttempts: 0,
        lockUntil: null,
      },
    });
    console.log('Старый пользователь разблокирован');
  } else {
    console.log('Старый пользователь не найден');
  }

  // 2️⃣ Создаём нового администратора
  const existingAdmin = await payload.find({
    collection: 'users',
    where: { email: { equals: adminEmail } },
  });

  if (existingAdmin.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email: adminEmail,
        password: adminPassword,
        roles: ['admin'], // роль администратора
      },
    });
    console.log('Новый админ создан:', adminEmail);
  } else {
    console.log('Админ с таким email уже существует');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
