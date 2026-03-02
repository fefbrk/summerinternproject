// Mock Database - Basit JSON tabanlı veri saklama sistemi

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'sipariş alındı' | 'hazırlanıyor' | 'yolda' | 'teslim edildi';
  shippingAddress: OrderShippingAddress;
  customerName: string;
  customerEmail: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface OrderShippingAddress {
  name: string;
  phone?: string;
  email?: string;
  address: string;
  city: string;
  province?: string;
  zipCode?: string;
  country?: string;
}

export interface RegistrationContactInfo {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
}

export interface CourseRegistrationData {
  shippingInfo?: RegistrationContactInfo;
  billingInfo?: RegistrationContactInfo;
}

export interface CourseRegistration {
  id: string;
  userId: string;
  courseName: string;
  registrationData: CourseRegistrationData;
  status: 'kayıt alındı' | 'aktif' | 'tamamlandı';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingZipCode: string;
  createdAt: string;
}

// Mock data storage
let mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@kinderlab.com',
    name: 'Admin User',
    password: 'admin123',
    createdAt: '2024-01-15T10:30:00.000Z'
  },
  {
    id: '2',
    email: 'test@example.com',
    name: 'Test User',
    password: 'test123',
    createdAt: '2024-02-20T14:15:00.000Z'
  },
  {
    id: '3',
    email: 'ahmet.yilmaz@gmail.com',
    name: 'Ahmet Yılmaz',
    password: 'ahmet123',
    createdAt: '2024-03-10T09:45:00.000Z'
  },
  {
    id: '4',
    email: 'fatma.kaya@hotmail.com',
    name: 'Fatma Kaya',
    password: 'fatma123',
    createdAt: '2024-04-05T16:20:00.000Z'
  },
  {
    id: '5',
    email: 'mehmet.demir@yahoo.com',
    name: 'Mehmet Demir',
    password: 'mehmet123',
    createdAt: '2024-05-12T11:10:00.000Z'
  }
];

let mockOrders: Order[] = [
  {
    id: '1001',
    userId: '2',
    items: [
      { id: 'kibo-10', name: 'KIBO 10 Kit', quantity: 1, price: 229.95, image: '/assets/shop/kibokits/KIBO-10-package.png' },
      { id: 'marker-set', name: 'Marker Extension Set', quantity: 2, price: 19.95, image: '/assets/shop/funextensionsets/Marker-Extension-Set.png' }
    ],
    totalAmount: 269.85,
    status: 'sipariş alındı',
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
    status: 'hazırlanıyor',
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
    status: 'yolda',
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
    status: 'teslim edildi',
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
    userId: '2',
    items: [
      { id: 'expression-module', name: 'Expression Module', quantity: 1, price: 49.95, image: '/assets/shop/funextensionsets/KIBO-expressionmodule.png' },
      { id: 'sound-record', name: 'Sound & Record Module', quantity: 1, price: 59.95, image: '/assets/shop/funextensionsets/KIBO-sound.png' }
    ],
    totalAmount: 109.90,
    status: 'hazırlanıyor',
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
    createdAt: '2025-01-25T10:30:00.000Z'
  }
];

let mockCourseRegistrations: CourseRegistration[] = [
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
    status: 'kayıt alındı',
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
    status: 'aktif',
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
    status: 'tamamlandı',
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
    userId: '2',
    courseName: 'KIBO Home Robotics Course',
    registrationData: {
      shippingInfo: {
        firstName: 'Test',
        lastName: 'User',
        address: '123 Main Street, Apt 4B',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        phone: '+1-555-0123',
        email: 'test@example.com'
      },
      billingInfo: {
        firstName: 'Test',
        lastName: 'User',
        address: '123 Main Street, Apt 4B',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        phone: '+1-555-0123',
        email: 'test@example.com'
      }
    },
    status: 'aktif',
    customerName: 'Test User',
    customerEmail: 'test@example.com',
    customerPhone: '+1-555-0123',
    shippingAddress: '123 Main Street, Apt 4B',
    shippingCity: 'New York',
    shippingState: 'NY',
    shippingZipCode: '10001',
    billingAddress: '123 Main Street, Apt 4B',
    billingCity: 'New York',
    billingState: 'NY',
    billingZipCode: '10001',
    createdAt: '2025-01-23T08:30:00.000Z'
  }
];

// Helper functions
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

// User operations
export const mockUserService = {
  // Register new user
  register: (email: string, password: string, name: string): User => {
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const newUser: User = {
      id: generateId(),
      email,
      password,
      name,
      createdAt: new Date().toISOString()
    };

    mockUsers.push(newUser);
    localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
    return newUser;
  },

  // Login user
  login: (email: string, password: string): User => {
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return user;
  },

  // Get all users (admin only)
  getAllUsers: (): User[] => {
    return mockUsers;
  }
};

// Order operations
export const mockOrderService = {
  // Create new order
  createOrder: (
    userId: string,
    items: OrderItem[],
    totalAmount: number,
    shippingAddress: OrderShippingAddress,
    customerName: string,
    customerEmail: string
  ): Order => {
    const newOrder: Order = {
      id: generateId(),
      userId,
      items,
      totalAmount,
      status: 'sipariş alındı',
      shippingAddress,
      customerName,
      customerEmail,
      createdAt: new Date().toISOString()
    };

    mockOrders.push(newOrder);
    localStorage.setItem('mockOrders', JSON.stringify(mockOrders));
    return newOrder;
  },

  // Get user orders
  getUserOrders: (userId: string): Order[] => {
    return mockOrders.filter(order => order.userId === userId);
  },

  // Get all orders (admin only)
  getAllOrders: (): Order[] => {
    return mockOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // Update order status
  updateOrderStatus: (orderId: string, status: Order['status']): Order => {
    const orderIndex = mockOrders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) {
      throw new Error('Order not found');
    }

    mockOrders[orderIndex].status = status;
    localStorage.setItem('mockOrders', JSON.stringify(mockOrders));
    return mockOrders[orderIndex];
  }
};

// Course registration operations
export const mockCourseService = {
  // Register for course
  registerForCourse: (
    userId: string,
    courseName: string,
    registrationData: CourseRegistrationData,
    customerName: string,
    customerEmail: string
  ): CourseRegistration => {
    // Check if already registered
    const existingRegistration = mockCourseRegistrations.find(
      reg => reg.userId === userId && reg.courseName === courseName
    );
    
    if (existingRegistration) {
      throw new Error('Bu kursa zaten kayıt oldunuz');
    }

    const newRegistration: CourseRegistration = {
      id: generateId(),
      userId,
      courseName,
      registrationData,
      status: 'kayıt alındı',
      customerName,
      customerEmail,
      customerPhone: registrationData.shippingInfo?.phone || '',
      shippingAddress: registrationData.shippingInfo?.address || '',
      shippingCity: registrationData.shippingInfo?.city || '',
      shippingState: registrationData.shippingInfo?.state || '',
      shippingZipCode: registrationData.shippingInfo?.zipCode || '',
      billingAddress: registrationData.billingInfo?.address || '',
      billingCity: registrationData.billingInfo?.city || '',
      billingState: registrationData.billingInfo?.state || '',
      billingZipCode: registrationData.billingInfo?.zipCode || '',
      createdAt: new Date().toISOString()
    };

    mockCourseRegistrations.push(newRegistration);
    localStorage.setItem('mockCourseRegistrations', JSON.stringify(mockCourseRegistrations));
    return newRegistration;
  },

  // Get user registrations
  getUserRegistrations: (userId: string): CourseRegistration[] => {
    return mockCourseRegistrations.filter(reg => reg.userId === userId);
  },

  // Get all registrations (admin only)
  getAllRegistrations: (): CourseRegistration[] => {
    return mockCourseRegistrations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // Update registration status
  updateRegistrationStatus: (registrationId: string, status: CourseRegistration['status']): CourseRegistration => {
    const regIndex = mockCourseRegistrations.findIndex(reg => reg.id === registrationId);
    if (regIndex === -1) {
      throw new Error('Registration not found');
    }

    mockCourseRegistrations[regIndex].status = status;
    localStorage.setItem('mockCourseRegistrations', JSON.stringify(mockCourseRegistrations));
    return mockCourseRegistrations[regIndex];
  }
};

// Initialize data from localStorage
const initializeData = () => {
  const savedUsers = localStorage.getItem('mockUsers');
  if (savedUsers) {
    mockUsers = JSON.parse(savedUsers);
  } else {
    // İlk kez yükleniyorsa demo verileri localStorage'a kaydet
    localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
  }

  const savedOrders = localStorage.getItem('mockOrders');
  if (savedOrders) {
    mockOrders = JSON.parse(savedOrders);
  } else {
    // İlk kez yükleniyorsa demo verileri localStorage'a kaydet
    localStorage.setItem('mockOrders', JSON.stringify(mockOrders));
  }

  const savedRegistrations = localStorage.getItem('mockCourseRegistrations');
  if (savedRegistrations) {
    mockCourseRegistrations = JSON.parse(savedRegistrations);
  } else {
    // İlk kez yükleniyorsa demo verileri localStorage'a kaydet
    localStorage.setItem('mockCourseRegistrations', JSON.stringify(mockCourseRegistrations));
  }
};

// Force reload demo data function
export const loadDemoData = () => {
  // Demo verileri localStorage'a zorla yükle
  localStorage.setItem('mockUsers', JSON.stringify([
    {
      id: '1',
      email: 'admin@kinderlab.com',
      name: 'Admin User',
      password: 'admin123',
      createdAt: '2024-01-15T10:30:00.000Z'
    },
    {
      id: '2',
      email: 'test@example.com',
      name: 'Test User',
      password: 'test123',
      createdAt: '2024-02-20T14:15:00.000Z'
    },
    {
      id: '3',
      email: 'ahmet.yilmaz@gmail.com',
      name: 'Ahmet Yılmaz',
      password: 'ahmet123',
      createdAt: '2024-03-10T09:45:00.000Z'
    },
    {
      id: '4',
      email: 'fatma.kaya@hotmail.com',
      name: 'Fatma Kaya',
      password: 'fatma123',
      createdAt: '2024-04-05T16:20:00.000Z'
    },
    {
      id: '5',
      email: 'mehmet.demir@yahoo.com',
      name: 'Mehmet Demir',
      password: 'mehmet123',
      createdAt: '2024-05-12T11:10:00.000Z'
    }
  ]));

  localStorage.setItem('mockOrders', JSON.stringify([
    {
      id: '1001',
      userId: '2',
      items: [
        { id: 'kibo-10', name: 'KIBO 10 Kit', quantity: 1, price: 229.95, image: '/assets/shop/kibokits/KIBO-10-package.png' },
        { id: 'marker-set', name: 'Marker Extension Set', quantity: 2, price: 19.95, image: '/assets/shop/funextensionsets/Marker-Extension-Set.png' }
      ],
      totalAmount: 269.85,
      status: 'sipariş alındı',
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
      status: 'hazırlanıyor',
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
      status: 'yolda',
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
      status: 'teslim edildi',
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
      userId: '2',
      items: [
        { id: 'expression-module', name: 'Expression Module', quantity: 1, price: 49.95, image: '/assets/shop/funextensionsets/KIBO-expressionmodule.png' },
        { id: 'sound-record', name: 'Sound & Record Module', quantity: 1, price: 59.95, image: '/assets/shop/funextensionsets/KIBO-sound.png' }
      ],
      totalAmount: 109.90,
      status: 'hazırlanıyor',
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
      createdAt: '2025-01-25T10:30:00.000Z'
    }
  ]));

  localStorage.setItem('mockCourseRegistrations', JSON.stringify([
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
      status: 'kayıt alındı',
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
      status: 'aktif',
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
      status: 'tamamlandı',
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
      userId: '2',
      courseName: 'KIBO Home Robotics Course',
      registrationData: {
        shippingInfo: {
          firstName: 'Test',
          lastName: 'User',
          address: '123 Main Street, Apt 4B',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          phone: '+1-555-0123',
          email: 'test@example.com'
        },
        billingInfo: {
          firstName: 'Test',
          lastName: 'User',
          address: '123 Main Street, Apt 4B',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          phone: '+1-555-0123',
          email: 'test@example.com'
        }
      },
      status: 'aktif',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '+1-555-0123',
      shippingAddress: '123 Main Street, Apt 4B',
      shippingCity: 'New York',
      shippingState: 'NY',
      shippingZipCode: '10001',
      billingAddress: '123 Main Street, Apt 4B',
      billingCity: 'New York',
      billingState: 'NY',
      billingZipCode: '10001',
      createdAt: '2025-01-23T08:30:00.000Z'
    }
  ]));

  // Verileri yeniden yükle
  initializeData();
};

// Initialize on import
initializeData();
