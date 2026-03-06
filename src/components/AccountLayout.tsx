import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, MapPin, CreditCard, Settings } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

interface AccountLayoutProps {
  children?: ReactNode;
  onMenuChange?: (menuKey: string) => void;
  activeMenu?: string;
}

const AccountLayout = ({ children, onMenuChange, activeMenu = 'orders' }: AccountLayoutProps) => {
  const menuItems = [
    {
      key: 'orders',
      label: 'My Orders',
      icon: ShoppingBag,
    },
    {
      key: 'addresses',
      label: 'My Addresses',
      icon: MapPin,
    },
    {
      key: 'payment-methods',
      label: 'Payment Setup',
      icon: CreditCard,
    },
    {
      key: 'settings',
      label: 'Account Settings',
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-orange-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-purple-200">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">My Account</h2>
                  <nav className="space-y-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeMenu === item.key;
                      
                      return (
                        <Button
                          key={item.key}
                          variant={isActive ? 'default' : 'ghost'}
                          className={`w-full justify-start ${
                            isActive 
                              ? 'bg-kibo-orange hover:bg-kibo-orange/90' 
                              : 'hover:bg-kibo-orange/10'
                          }`}
                          onClick={() => onMenuChange?.(item.key)}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {item.label}
                        </Button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AccountLayout;
