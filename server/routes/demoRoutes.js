const crypto = require('crypto');

const registerDemoRoutes = (app, deps) => {
  const {
    database,
    hashPassword,
    ensureDefaultAdminUser,
    demoEndpointsEnabled,
    adminEmail,
  } = deps;

// Demo veri yükleme
app.post('/api/load-demo-data', async (req, res) => {
  try {
    if (!demoEndpointsEnabled) {
      return res.status(404).json({ error: 'Endpoint not available' });
    }

    const demoPassword = () => crypto.randomBytes(12).toString('base64url');

    const demoUsers = [
      {
        id: '1',
        email: adminEmail,
        name: 'Admin User',
        password: demoPassword(),
        isAdmin: 1,
        createdAt: '2024-01-15T10:30:00.000Z'
      },
      {
        id: '2',
        email: 'test@example.com',
        name: 'Test User',
        password: demoPassword(),
        createdAt: '2024-02-20T14:15:00.000Z'
      },
      {
        id: '3',
        email: 'ahmet.yilmaz@gmail.com',
        name: 'Ahmet Yılmaz',
        password: demoPassword(),
        createdAt: '2024-03-10T09:45:00.000Z'
      },
      {
        id: '4',
        email: 'fatma.kaya@hotmail.com',
        name: 'Fatma Kaya',
        password: demoPassword(),
        createdAt: '2024-04-05T16:20:00.000Z'
      },
      {
        id: '5',
        email: 'mehmet.demir@yahoo.com',
        name: 'Mehmet Demir',
        password: demoPassword(),
        createdAt: '2024-05-12T11:10:00.000Z'
      },
      {
        id: '6',
        email: 'ayse.ozkan@gmail.com',
        name: 'Ayşe Özkan',
        password: demoPassword(),
        createdAt: '2024-06-18T08:25:00.000Z'
      },
      {
        id: '7',
        email: 'ali.celik@outlook.com',
        name: 'Ali Çelik',
        password: demoPassword(),
        createdAt: '2024-07-22T15:40:00.000Z'
      },
      {
        id: '8',
        email: 'zeynep.arslan@gmail.com',
        name: 'Zeynep Arslan',
        password: demoPassword(),
        createdAt: '2024-08-14T12:55:00.000Z'
      },
      {
        id: '9',
        email: 'john.smith@gmail.com',
        name: 'John Smith',
        password: demoPassword(),
        createdAt: '2024-09-03T10:15:00.000Z'
      },
      {
        id: '10',
        email: 'maria.garcia@yahoo.com',
        name: 'Maria Garcia',
        password: demoPassword(),
        createdAt: '2024-10-07T14:30:00.000Z'
      }
    ];
    
    const demoOrders = [
      {
        id: '1001',
        userId: '2',
        items: [
          { id: 'kibo-10', name: 'KIBO 10 Kit', quantity: 1, price: 229.95, image: '/assets/shop/kibokits/KIBO-10-package.png' },
          { id: 'marker-set', name: 'Marker Extension Set', quantity: 2, price: 19.95, image: '/assets/shop/funextensionsets/Marker-Extension-Set.png' }
        ],
        totalAmount: 269.85,
        status: 'received',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        shippingAddress: {
          name: 'Test User',
          phone: '+1-555-0123',
          email: 'test@example.com',
          address: '123 Main Street, Apt 4B',
          city: 'New York',
          province: 'NY',
          zipCode: '10001',
          country: 'United States'
        },
        createdAt: '2025-01-20T14:30:00.000Z'
      },
      {
        id: '1002',
        userId: '3',
        items: [
          { id: 'kibo-15', name: 'KIBO 15 Kit', quantity: 1, price: 329.95, image: '/assets/shop/kibokits/KIBO-15-package.png' }
        ],
        totalAmount: 329.95,
        status: 'preparing',
        customerName: 'Ahmet Yılmaz',
        customerEmail: 'ahmet.yilmaz@gmail.com',
        shippingAddress: {
          name: 'Ahmet Yılmaz',
          phone: '+90-532-123-4567',
          email: 'ahmet.yilmaz@gmail.com',
          address: 'Atatürk Caddesi No:45 Daire:8',
          city: 'İstanbul',
          province: 'İstanbul',
          zipCode: '34000',
          country: 'Turkey'
        },
        createdAt: '2025-01-22T09:15:00.000Z'
      },
      {
        id: '1003',
        userId: '4',
        items: [
          { id: 'kibo-21', name: 'KIBO 21 Kit', quantity: 1, price: 429.95, image: '/assets/shop/kibokits/KIBO-21-package.png' },
          { id: 'building-brick', name: 'Building Brick Extension Set', quantity: 1, price: 39.95, image: '/assets/shop/funextensionsets/KIBO-buildingbrickb.png' }
        ],
        totalAmount: 469.90,
        status: 'shipping',
        customerName: 'Fatma Kaya',
        customerEmail: 'fatma.kaya@hotmail.com',
        shippingAddress: {
          name: 'Fatma Kaya',
          phone: '+90-505-987-6543',
          email: 'fatma.kaya@hotmail.com',
          address: 'Cumhuriyet Mahallesi 15. Sokak No:23',
          city: 'Ankara',
          province: 'Ankara',
          zipCode: '06000',
          country: 'Turkey'
        },
        createdAt: '2025-01-18T16:45:00.000Z'
      },
      {
        id: '1004',
        userId: '5',
        items: [
          { id: 'kibo-18', name: 'KIBO 18 Kit', quantity: 2, price: 379.95, image: '/assets/shop/kibokits/KIBO-18-package.png' }
        ],
        totalAmount: 759.90,
        status: 'delivered',
        customerName: 'Mehmet Demir',
        customerEmail: 'mehmet.demir@yahoo.com',
        shippingAddress: {
          name: 'Mehmet Demir',
          phone: '+90-542-111-2233',
          email: 'mehmet.demir@yahoo.com',
          address: 'Yeni Mahalle Okul Sokak No:67',
          city: 'İzmir',
          province: 'İzmir',
          zipCode: '35000',
          country: 'Turkey'
        },
        createdAt: '2025-01-15T12:20:00.000Z'
      },
      {
        id: '1005',
        userId: '6',
        items: [
          { id: 'expression-module', name: 'Expression Module', quantity: 1, price: 49.95, image: '/assets/shop/funextensionsets/KIBO-expressionmodule.png' },
          { id: 'sound-record', name: 'Sound & Record Module', quantity: 1, price: 59.95, image: '/assets/shop/funextensionsets/KIBO-sound.png' }
        ],
        totalAmount: 109.90,
        status: 'preparing',
        customerName: 'Ayşe Özkan',
        customerEmail: 'ayse.ozkan@gmail.com',
        shippingAddress: {
          name: 'Ayşe Özkan',
          phone: '+90-533-444-5566',
          email: 'ayse.ozkan@gmail.com',
          address: 'Bahçelievler Mahallesi 12. Cadde No:89',
          city: 'Bursa',
          province: 'Bursa',
          zipCode: '16000',
          country: 'Turkey'
        },
        createdAt: '2025-01-25T10:30:00.000Z'
      },
      {
        id: '1006',
        userId: '7',
        items: [
          { id: 'kibo-12', name: 'KIBO 12 Kit', quantity: 1, price: 279.95, image: '/assets/shop/kibokits/KIBO-12-package.png' },
          { id: 'art-module', name: 'Art Module', quantity: 1, price: 29.95, image: '/assets/shop/funextensionsets/KIBO-artmodule.png' }
        ],
        totalAmount: 309.90,
        status: 'received',
        customerName: 'Ali Çelik',
        customerEmail: 'ali.celik@outlook.com',
        shippingAddress: {
          name: 'Ali Çelik',
          phone: '+90-544-777-8899',
          email: 'ali.celik@outlook.com',
          address: 'Merkez Mahallesi Atatürk Bulvarı No:156',
          city: 'Antalya',
          province: 'Antalya',
          zipCode: '07000',
          country: 'Turkey'
        },
        createdAt: '2025-01-28T08:45:00.000Z'
      },
      {
        id: '1007',
        userId: '8',
        items: [
          { id: 'kibo-21', name: 'KIBO 21 Kit', quantity: 1, price: 429.95, image: '/assets/shop/kibokits/KIBO-21-package.png' }
        ],
        totalAmount: 429.95,
        status: 'shipping',
        customerName: 'Zeynep Arslan',
        customerEmail: 'zeynep.arslan@gmail.com',
        shippingAddress: {
          name: 'Zeynep Arslan',
          phone: '+90-555-123-9876',
          email: 'zeynep.arslan@gmail.com',
          address: 'Çankaya Mahallesi Tunalı Hilmi Caddesi No:78',
          city: 'Ankara',
          province: 'Ankara',
          zipCode: '06700',
          country: 'Turkey'
        },
        createdAt: '2025-01-26T13:20:00.000Z'
      },
      {
        id: '1008',
        userId: '9',
        items: [
          { id: 'kibo-15', name: 'KIBO 15 Kit', quantity: 1, price: 329.95, image: '/assets/shop/kibokits/KIBO-15-package.png' },
          { id: 'light-module', name: 'Light Module', quantity: 2, price: 24.95, image: '/assets/shop/funextensionsets/KIBO-lightmodule.png' }
        ],
        totalAmount: 379.85,
        status: 'delivered',
        customerName: 'John Smith',
        customerEmail: 'john.smith@gmail.com',
        shippingAddress: {
          name: 'John Smith',
          phone: '+1-555-987-6543',
          email: 'john.smith@gmail.com',
          address: '456 Oak Avenue, Suite 12',
          city: 'Los Angeles',
          province: 'CA',
          zipCode: '90210',
          country: 'United States'
        },
        createdAt: '2025-01-12T11:15:00.000Z'
      },
      {
        id: '1009',
        userId: '10',
        items: [
          { id: 'kibo-18', name: 'KIBO 18 Kit', quantity: 1, price: 379.95, image: '/assets/shop/kibokits/KIBO-18-package.png' },
          { id: 'sensor-module', name: 'Sensor Module', quantity: 1, price: 34.95, image: '/assets/shop/funextensionsets/KIBO-sensormodule.png' }
        ],
        totalAmount: 414.90,
        status: 'preparing',
        customerName: 'Maria Garcia',
        customerEmail: 'maria.garcia@yahoo.com',
        shippingAddress: {
          name: 'Maria Garcia',
          phone: '+1-555-246-8135',
          email: 'maria.garcia@yahoo.com',
          address: '789 Pine Street, Apt 5C',
          city: 'Miami',
          province: 'FL',
          zipCode: '33101',
          country: 'United States'
        },
        createdAt: '2025-01-29T16:40:00.000Z'
      }
    ];
    
    const demoRegistrations = [
      {
        id: '2001',
        userId: '3',
        courseName: 'KIBO Home Robotics Course',
        registrationData: {
          shippingInfo: {
            firstName: 'Ahmet',
            lastName: 'Yılmaz',
            address: 'Atatürk Caddesi No:45 Daire:8',
            city: 'İstanbul',
            state: 'İstanbul',
            zipCode: '34000',
            phone: '+90-532-123-4567',
            email: 'ahmet.yilmaz@gmail.com'
          },
          billingInfo: {
            firstName: 'Ahmet',
            lastName: 'Yılmaz',
            address: 'Atatürk Caddesi No:45 Daire:8',
            city: 'İstanbul',
            state: 'İstanbul',
            zipCode: '34000',
            phone: '+90-532-123-4567',
            email: 'ahmet.yilmaz@gmail.com'
          }
        },
        status: 'registered',
        customerName: 'Ahmet Yılmaz',
        customerEmail: 'ahmet.yilmaz@gmail.com',
        customerPhone: '+90-532-123-4567',
        shippingAddress: 'Atatürk Caddesi No:45 Daire:8',
        shippingCity: 'İstanbul',
        shippingState: 'İstanbul',
        shippingZipCode: '34000',
        billingAddress: 'Atatürk Caddesi No:45 Daire:8',
        billingCity: 'İstanbul',
        billingState: 'İstanbul',
        billingZipCode: '34000',
        createdAt: '2025-01-21T13:45:00.000Z'
      },
      {
        id: '2002',
        userId: '4',
        courseName: 'KIBO Home Robotics Course',
        registrationData: {
          shippingInfo: {
            firstName: 'Fatma',
            lastName: 'Kaya',
            address: 'Cumhuriyet Mahallesi 15. Sokak No:23',
            city: 'Ankara',
            state: 'Ankara',
            zipCode: '06000',
            phone: '+90-505-987-6543',
            email: 'fatma.kaya@hotmail.com'
          },
          billingInfo: {
            firstName: 'Fatma',
            lastName: 'Kaya',
            address: 'Cumhuriyet Mahallesi 15. Sokak No:23',
            city: 'Ankara',
            state: 'Ankara',
            zipCode: '06000',
            phone: '+90-505-987-6543',
            email: 'fatma.kaya@hotmail.com'
          }
        },
        status: 'active',
        customerName: 'Fatma Kaya',
        customerEmail: 'fatma.kaya@hotmail.com',
        customerPhone: '+90-505-987-6543',
        shippingAddress: 'Cumhuriyet Mahallesi 15. Sokak No:23',
        shippingCity: 'Ankara',
        shippingState: 'Ankara',
        shippingZipCode: '06000',
        billingAddress: 'Cumhuriyet Mahallesi 15. Sokak No:23',
        billingCity: 'Ankara',
        billingState: 'Ankara',
        billingZipCode: '06000',
        createdAt: '2025-01-19T11:20:00.000Z'
      },
      {
        id: '2003',
        userId: '5',
        courseName: 'KIBO Home Robotics Course',
        registrationData: {
          shippingInfo: {
            firstName: 'Mehmet',
            lastName: 'Demir',
            address: 'Yeni Mahalle Okul Sokak No:67',
            city: 'İzmir',
            state: 'İzmir',
            zipCode: '35000',
            phone: '+90-542-111-2233',
            email: 'mehmet.demir@yahoo.com'
          },
          billingInfo: {
            firstName: 'Mehmet',
            lastName: 'Demir',
            address: 'Yeni Mahalle Okul Sokak No:67',
            city: 'İzmir',
            state: 'İzmir',
            zipCode: '35000',
            phone: '+90-542-111-2233',
            email: 'mehmet.demir@yahoo.com'
          }
        },
        status: 'completed',
        customerName: 'Mehmet Demir',
        customerEmail: 'mehmet.demir@yahoo.com',
        customerPhone: '+90-542-111-2233',
        shippingAddress: 'Yeni Mahalle Okul Sokak No:67',
        shippingCity: 'İzmir',
        shippingState: 'İzmir',
        shippingZipCode: '35000',
        billingAddress: 'Yeni Mahalle Okul Sokak No:67',
        billingCity: 'İzmir',
        billingState: 'İzmir',
        billingZipCode: '35000',
        createdAt: '2025-01-16T15:10:00.000Z'
      },
      {
        id: '2004',
        userId: '6',
        courseName: 'KIBO Home Robotics Course',
        registrationData: {
          shippingInfo: {
            firstName: 'Ayşe',
            lastName: 'Özkan',
            address: 'Bahçelievler Mahallesi 12. Cadde No:89',
            city: 'Bursa',
            state: 'Bursa',
            zipCode: '16000',
            phone: '+90-533-444-5566',
            email: 'ayse.ozkan@gmail.com'
          },
          billingInfo: {
            firstName: 'Ayşe',
            lastName: 'Özkan',
            address: 'Bahçelievler Mahallesi 12. Cadde No:89',
            city: 'Bursa',
            state: 'Bursa',
            zipCode: '16000',
            phone: '+90-533-444-5566',
            email: 'ayse.ozkan@gmail.com'
          }
        },
        status: 'active',
        customerName: 'Ayşe Özkan',
        customerEmail: 'ayse.ozkan@gmail.com',
        customerPhone: '+90-533-444-5566',
        shippingAddress: 'Bahçelievler Mahallesi 12. Cadde No:89',
        shippingCity: 'Bursa',
        shippingState: 'Bursa',
        shippingZipCode: '16000',
        billingAddress: 'Bahçelievler Mahallesi 12. Cadde No:89',
        billingCity: 'Bursa',
        billingState: 'Bursa',
        billingZipCode: '16000',
        createdAt: '2025-01-23T08:30:00.000Z'
      },
      {
        id: '2005',
        userId: '9',
        courseName: 'KIBO Home Robotics Course',
        registrationData: {
          shippingInfo: {
            firstName: 'John',
            lastName: 'Smith',
            address: '456 Oak Avenue, Suite 12',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210',
            phone: '+1-555-987-6543',
            email: 'john.smith@gmail.com'
          },
          billingInfo: {
            firstName: 'John',
            lastName: 'Smith',
            address: '456 Oak Avenue, Suite 12',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210',
            phone: '+1-555-987-6543',
            email: 'john.smith@gmail.com'
          }
        },
        status: 'registered',
        customerName: 'John Smith',
        customerEmail: 'john.smith@gmail.com',
        customerPhone: '+1-555-987-6543',
        shippingAddress: '456 Oak Avenue, Suite 12',
        shippingCity: 'Los Angeles',
        shippingState: 'CA',
        shippingZipCode: '90210',
        billingAddress: '456 Oak Avenue, Suite 12',
        billingCity: 'Los Angeles',
        billingState: 'CA',
        billingZipCode: '90210',
        createdAt: '2025-01-27T14:25:00.000Z'
      }
    ];
    
    // Demo Contact Us verileri
    const demoContacts = [
      {
        id: '3001',
        type: 'general',
        name: 'Mehmet Demir',
        email: 'mehmet.demir@gmail.com',
        subject: 'KIBO Robotik Kiti Hakkında',
        message: 'Merhaba, KIBO 18 kiti hakkında daha fazla bilgi almak istiyorum. Fiyat ve teslimat süresi nedir?',
        status: 'new',
        createdAt: '2024-03-15T11:20:00.000Z'
      },
      {
        id: '3002',
        type: 'support',
        name: 'Ayşe Kaya',
        email: 'ayse.kaya@hotmail.com',
        subject: 'Teknik Destek Talebi',
        message: 'KIBO robotumun sensörleri düzgün çalışmıyor. Nasıl tamir edebilirim?',
        status: 'answered',
        createdAt: '2024-03-18T14:30:00.000Z'
      },
      {
        id: '3003',
        type: 'training',
        name: 'Mustafa Yıldız',
        email: 'mustafa.yildiz@gmail.com',
        subject: 'Eğitim Programları',
        message: 'Öğretmenler için KIBO eğitim programlarınız var mı? Okulumuzda kullanmak istiyoruz.',
        status: 'reviewing',
        createdAt: '2024-03-20T09:45:00.000Z'
      },
      {
        id: '3004',
        type: 'sales',
        name: 'Elif Şahin',
        email: 'elif.sahin@gmail.com',
        subject: 'Toplu Satış Talebi',
        message: 'Okulumuz için 20 adet KIBO 15 kit almak istiyoruz. Toplu alımda indirim var mı?',
        status: 'reviewing',
        createdAt: '2024-11-12T10:15:00.000Z'
      },
      {
        id: '3005',
        type: 'general',
        name: 'Can Özdemir',
        email: 'can.ozdemir@hotmail.com',
        subject: 'Ürün Karşılaştırması',
        message: 'KIBO 15 ile KIBO 18 arasındaki farklar nelerdir? Hangi yaş grubu için daha uygun?',
        status: 'answered',
        createdAt: '2024-12-05T16:30:00.000Z'
      },
      {
        id: '3006',
        type: 'support',
        name: 'Selin Yılmaz',
        email: 'selin.yilmaz@yahoo.com',
        subject: 'Kurulum Sorunu',
        message: 'KIBO yazılımını bilgisayarıma kuramıyorum. Yardım edebilir misiniz?',
        status: 'new',
        createdAt: '2025-01-08T13:45:00.000Z'
      },
      {
        id: '3007',
        type: 'training',
        name: 'Emre Kılıç',
        email: 'emre.kilic@gmail.com',
        subject: 'Öğretmen Eğitimi',
        message: 'KIBO kullanımı konusunda öğretmenlerimize eğitim verebilir misiniz? Ankara\'da bulunuyoruz.',
        status: 'reviewing',
        createdAt: '2025-01-15T09:20:00.000Z'
      },
      {
        id: '3008',
        type: 'general',
        name: 'Deniz Acar',
        email: 'deniz.acar@outlook.com',
        subject: 'Garanti Süresi',
        message: 'KIBO robotlarının garanti süresi ne kadar? Garanti kapsamında neler var?',
        status: 'answered',
        createdAt: '2025-01-20T11:10:00.000Z'
      },
      {
        id: '3009',
        type: 'sales',
        name: 'Burak Tekin',
        email: 'burak.tekin@gmail.com',
        subject: 'Bayi Başvurusu',
        message: 'KIBO ürünlerinin bayisi olmak istiyorum. Başvuru süreci nasıl işliyor?',
        status: 'reviewing',
        createdAt: '2025-01-25T14:55:00.000Z'
      },
      {
        id: '3010',
        type: 'support',
        name: 'Gizem Polat',
        email: 'gizem.polat@hotmail.com',
        subject: 'Yedek Parça Talebi',
        message: 'KIBO robotumun motor parçası bozuldu. Yedek parça temin edebilir miyim?',
        status: 'closed',
        createdAt: '2025-01-28T08:40:00.000Z'
      },
      {
        id: '3011',
        type: 'general',
        name: 'Oğuz Çetin',
        email: 'oguz.cetin@yahoo.com',
        subject: 'Kargo Süresi',
        message: 'Sipariş verdiğim KIBO kit ne zaman elime ulaşır? Kargo takip numarası var mı?',
        status: 'new',
        createdAt: '2025-01-30T12:25:00.000Z'
      },
      {
        id: '3012',
        type: 'training',
        name: 'Pınar Doğan',
        email: 'pinar.dogan@gmail.com',
        subject: 'Online Eğitim',
        message: 'KIBO kullanımı için online eğitim videoları var mı? Türkçe kaynak arıyorum.',
        status: 'answered',
        createdAt: '2025-01-31T15:50:00.000Z'
      }
    ];
    
    // Demo Blog Posts verileri
    const demoBlogPosts = [
      {
        id: '4001',
        title: 'KIBO ile Robotik Eğitimde Yeni Bir Dönem',
        content: 'KIBO robotik setleri, çocukların kodlama ve robotik öğrenirken aynı zamanda yaratıcılıklarını geliştirmelerini sağlar. Bu blog yazısında, KIBO\'nun eğitimdeki önemini ve nasıl kullanıldığını detaylı olarak inceliyoruz.\n\nKIBO, çocukların ekran olmadan kodlama öğrenmelerini sağlayan benzersiz bir robotik eğitim setidir. Çocuklar, ahşap blokları kullanarak robotun hareketlerini programlar ve bu sayede algoritmik düşünme becerilerini geliştirirler.\n\nEğitimciler için KIBO, STEM eğitiminde önemli bir araçtır. Öğrenciler problem çözme, işbirliği ve yaratıcılık becerilerini geliştirirken aynı zamanda eğlenirler.',
        excerpt: 'KIBO robotik setleri ile çocukların kodlama ve robotik öğrenirken yaratıcılıklarını nasıl geliştirebileceklerini keşfedin.',
        author: 'Dr. Ayşe Yılmaz',
        publishDate: '2025-01-15T10:00:00.000Z',
        status: 'published',
        createdAt: '2025-01-10T09:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z'
      },
      {
        id: '4002',
        title: 'STEM Eğitiminde KIBO\'nun Rolü',
        content: 'STEM (Science, Technology, Engineering, Mathematics) eğitimi, 21. yüzyıl becerilerinin temelini oluşturur. KIBO, bu alanlarda çocukların ilgisini çekmek için tasarlanmış mükemmel bir araçtır.\n\nBu yazıda, KIBO\'nun STEM eğitimindeki rolünü ve öğrencilerin bu alanlardaki gelişimine nasıl katkı sağladığını ele alacağız.\n\nKIBO ile öğrenciler:\n- Matematiksel düşünme becerilerini geliştirir\n- Mühendislik tasarım sürecini öğrenir\n- Bilimsel merakı artırır\n- Teknolojiyi anlamlı bir şekilde kullanır\n\nÖğretmenler için KIBO, STEM derslerini daha etkileşimli ve eğlenceli hale getirir.',
        excerpt: 'KIBO\'nun STEM eğitimindeki önemini ve öğrencilerin bu alanlardaki gelişimine nasıl katkı sağladığını öğrenin.',
        author: 'Prof. Mehmet Demir',
        publishDate: '2025-01-20T14:30:00.000Z',
        status: 'published',
        createdAt: '2025-01-18T11:00:00.000Z',
        updatedAt: '2025-01-20T14:30:00.000Z'
      },
      {
        id: '4003',
        title: 'Erken Çocuklukta Kodlama Eğitimi',
        content: 'Erken çocukluk dönemi, çocukların öğrenme ve gelişiminde kritik bir öneme sahiptir. Bu dönemde kazanılan beceriler, çocuğun gelecekteki akademik ve sosyal başarısını etkiler.\n\nKodlama eğitimi, erken çocukluk döneminde şu becerileri geliştirir:\n\n1. Problem Çözme: Çocuklar, problemleri parçalara ayırmayı ve çözüm yolları bulmayı öğrenirler.\n2. Mantıksal Düşünme: Kodlama, mantıksal sıralama ve neden-sonuç ilişkisi kurmayı gerektirir.\n3. Yaratıcılık: Çocuklar, kendi projelerini yaratırken yaratıcılıklarını kullanırlar.\n4. İşbirliği: Grup çalışmalarıyla birlikte çalışma becerisi gelişir.\n\nKIBO, bu becerileri geliştirmek için tasarlanmış yaşa uygun bir robotik eğitim setidir.',
        excerpt: 'Erken çocukluk döneminde kodlama eğitiminin önemini ve KIBO\'nun bu süreçteki rolünü keşfedin.',
        author: 'Dr. Zeynep Arslan',
        publishDate: '2025-01-25T09:15:00.000Z',
        status: 'published',
        createdAt: '2025-01-22T08:00:00.000Z',
        updatedAt: '2025-01-25T09:15:00.000Z'
      },
      {
        id: '4004',
        title: 'KIBO ile Sınıf İçi Etkinlikler',
        content: 'KIBO robotik setleri, sınıf içinde birçok farklı etkinlik için kullanılabilir. Bu yazıda, öğretmenlerin sınıflarında uygulayabileceği pratik KIBO etkinliklerini paylaşacağız.\n\n1. Hikaye Anlatma: Öğrenciler, KIBO\'yu kullanarak kendi hikayelerini canlandırabilirler.\n2. Matematik Oyunları: KIBO ile şekil oluşturma, sayma ve ölçme etkinlikleri yapılabilir.\n3. Sanat Projesi: KIBO\'yu sanat eserleri oluşturmak için kullanmak.\n4. Fen Deneyleri: KIBO ile basit fen deneyleri yapmak.\n\nBu etkinlikler, öğrencilerin hem eğlenmesini hem de öğrenmesini sağlar. Öğretmenler, KIBO\'yu farklı derslerde entegre ederek öğrenmeyi daha etkileyici hale getirebilirler.',
        excerpt: 'Sınıfınızda KIBO ile uygulayabileceğiniz yaratıcı ve eğitici etkinlikleri keşfedin.',
        author: 'Öğr. Fatma Kaya',
        publishDate: '2025-02-01T11:45:00.000Z',
        status: 'draft',
        createdAt: '2025-01-28T13:00:00.000Z',
        updatedAt: '2025-02-01T11:45:00.000Z'
      },
      {
        id: '4005',
        title: 'Ebeveynler İçin KIBO Rehberi',
        content: 'Ebeveynler olarak, çocuklarınızın teknolojiyle sağlıklı bir ilişki kurmasını istersiniz. KIBO, çocuklarınıza teknolojiyi anlamlı bir şekilde kullanmayı öğreten harika bir araçtır.\n\nBu rehberde, ebeveynlerin KIBO\'yu evde nasıl kullanabileceğini ve çocuklarının gelişimine nasıl katkı sağlayacağını anlatacağız.\n\nKIBO ile Evde Eğitim:\n- Aile birlikte projeler yapabilir\n- Çocuğunuzun yaratıcılığını destekleyebilirsiniz\n- Ekran süresini azaltırken kaliteli zaman geçirebilirsiniz\n- Çocuğunuzun problem çözme becerilerini geliştirebilirsiniz\n\nKIBO, çocuklarınıza kodlama ve robotiği sevdirmek için harika bir başlangıç noktasıdır.',
        excerpt: 'Ebeveynler için KIBO rehberi: Çocuğunuzun teknolojiyle sağlıklı ilişki kurmasına yardımcı olun.',
        author: 'Dr. Ali Çelik',
        publishDate: '2025-02-05T16:20:00.000Z',
        status: 'draft',
        createdAt: '2025-02-02T10:00:00.000Z',
        updatedAt: '2025-02-05T16:20:00.000Z'
      }
    ];
    
    // Önce veritabanını temizle (bu işlem zaten admin kullanıcısını oluşturur)
    await database.clearAllData();
    
    const safeDemoUsers = demoUsers.map((user) => ({
      ...user,
      password: hashPassword(String(user.password || crypto.randomBytes(12).toString('base64url')))
    }));

    // Demo verilerini ekle (admin kullanıcısı hariç)
    for (const user of safeDemoUsers) {
      if (!user.isAdmin) {
        await database.createUser(user);
      }
    }

    await ensureDefaultAdminUser();
    
    for (const order of demoOrders) {
      await database.createOrder(order);
    }
    
    for (const registration of demoRegistrations) {
      await database.createRegistration(registration);
    }
    
    for (const contact of demoContacts) {
      await database.createContact(contact);
    }
    
    for (const blogPost of demoBlogPosts) {
      await database.createBlogPost(blogPost);
    }
    
    res.json({ message: 'Demo data loaded successfully' });
  } catch (error) {
    console.error('Error loading demo data:', error);
    res.status(500).json({ error: 'Failed to load demo data' });
  }
});
};

module.exports = registerDemoRoutes;
