import { PrismaClient } from '@prisma/client';
import { logDone, logStart } from '../log.util';

export async function seedAnnouncements(prisma: PrismaClient) {
  logStart('announcements');  
  
  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);

  const somePackage = await prisma.package.findFirst();

  const announcements = [
    {
      title: 'Jam Buka Spesial Libur Nasional',
      content: 'Gym akan buka lebih pendek (08:00-16:00) selama periode libur nasional mendatang. Terima kasih atas pengertiannya.',
      target: 'all' as const,
      package_id: null,
    },
    {
      title: 'Promo Perpanjangan Member Aktif',
      content: 'Khusus member dengan paket aktif, dapatkan diskon 15% untuk perpanjangan paket tahunan. Berlaku sampai akhir bulan.',
      target: somePackage ? ('specific_package' as const) : ('all' as const),
      package_id: somePackage?.id ?? null,
    },
    {
      title: 'Yuk Gabung Sekarang, Diskon Member Baru!',
      content: 'Belum punya paket aktif? Daftar sekarang dan dapatkan potongan harga khusus untuk paket bulanan pertamamu.',
      target: 'no_package' as const,
      package_id: null,
    },
    {
      title: 'Maintenance Alat Cardio',
      content: 'Beberapa unit treadmill akan menjalani maintenance rutin pada akhir pekan ini. Mohon maaf atas ketidaknyamanannya.',
      target: 'all' as const,
      package_id: null,
    },
  ];

  let totalCreated = 0;

  for (const announcement of announcements) {
    const existing = await prisma.announcement.findFirst({
      where: { title: announcement.title },
    });
    if (existing) continue;

    await prisma.announcement.create({
      data: {
        title: announcement.title,
        content: announcement.content,
        type: 'manual',
        target: announcement.target,
        package_id: announcement.package_id,
        published_at: now,
        expired_at: in30Days,
      },
    });
    
    totalCreated++;
  }

  logDone('announcements', `${totalCreated} announcements seeded`);
}