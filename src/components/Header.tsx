import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons';
import { ChevronDown, Menu, X, User, LogOut } from "lucide-react";
import kinderlabLogo from "@/assets/logo/kinderlab-robotics.png";
import kiboHeroLogo from "@/assets/logo/kibo-hero-logo.png";
import NewsTicker from "@/components/NewsTicker";
import MegaMenu from "./MegaMenu";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export type ActiveMenu = 'kibo' | 'educators' | 'resources' | null;

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(null);
  const cart = useCart();
  const { user, logout } = useAuth();
  const itemCount = cart.cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleMenuToggle = (menu: ActiveMenu) => {
    setActiveMenu(prev => (prev === menu ? null : menu));
  };

  const closeMenu = () => {
    setActiveMenu(null);
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-orange-50 relative">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img src={kinderlabLogo} alt="KinderLab Robotics" className="h-14 w-auto" />
                <img src={kiboHeroLogo} alt="KIBO Logo" className="h-14 w-auto ml-4 hidden md:block" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" onClick={() => handleMenuToggle('kibo')} className={`flex items-center gap-1 hover:bg-kibo-orange/20 hover:text-kibo-purple ${activeMenu === 'kibo' ? 'text-kibo-purple bg-kibo-orange/20' : ''}`}>
                KIBO <ChevronDown className={`h-4 w-4 transition-transform ${activeMenu === 'kibo' ? 'rotate-180' : ''}`} />
              </Button>
              <Button variant="ghost" onClick={() => handleMenuToggle('educators')} className={`flex items-center gap-1 hover:bg-kibo-orange/20 hover:text-kibo-purple ${activeMenu === 'educators' ? 'text-kibo-purple bg-kibo-orange/20' : ''}`}>
                For Educators <ChevronDown className={`h-4 w-4 transition-transform ${activeMenu === 'educators' ? 'rotate-180' : ''}`} />
              </Button>
              <Button variant="ghost" onClick={() => handleMenuToggle('resources')} className={`flex items-center gap-1 hover:bg-kibo-orange/20 hover:text-kibo-purple ${activeMenu === 'resources' ? 'text-kibo-purple bg-kibo-orange/20' : ''}`}>
                Resources <ChevronDown className={`h-4 w-4 transition-transform ${activeMenu === 'resources' ? 'rotate-180' : ''}`} />
              </Button>
              <Link to="/shop">
                <Button variant="ghost" className="flex items-center gap-1 hover:bg-kibo-orange/20 hover:text-kibo-purple">
                  Shop
                </Button>
              </Link>
              <div className="relative ml-2 group">
                <Link to="/cart">
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 flex items-center gap-2 group">
                    <FontAwesomeIcon icon={faCartShopping} className="transition-colors group-hover:text-kibo-purple" />
                  </Button>
                </Link>
                {itemCount > 0 && (
                  <span
                    key={`desktop-cart-count-${itemCount}`}
                    className="absolute -top-1 -right-1 bg-kibo-orange text-white text-xs rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center z-10 ring-2 ring-white shadow-sm transition-colors group-hover:text-kibo-purple motion-safe:animate-[bounce_0.25s_ease-in-out_1]"
                  >
                    {itemCount}
                  </span>
                )}
              </div>

              {/* Login/Logout Button */}
              {user ? (
                <div className="flex items-center ml-2">
                  <Link to="/account">
                    <Button variant="ghost" className="flex flex-col items-start gap-0 hover:bg-kibo-orange/20 hover:text-kibo-purple h-auto py-2 group">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium group-hover:text-kibo-purple">{user.name}</span>
                      </div>
                      <span className="text-xs ml-1 text-muted-foreground group-hover:text-kibo-purple">{user.email}</span>
                    </Button>
                  </Link>
                  {user.isAdmin && (
                    <Link to="/admin">
                      <Button
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 flex items-center gap-2 group ml-1"
                      >
                        <span className="group-hover:text-kibo-purple">Admin Panel</span>
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => logout()}
                    className="ml-1 text-purple-0 hover:text-kibo-purple hover:bg-kibo-orange/20"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Link to="/login">
                  <Button variant="ghost" className="flex items-center gap-1 hover:bg-kibo-orange/20 hover:text-kibo-purple ml-2">
                    Login
                  </Button>
                </Link>
              )}
            </nav>

            {/* Mobile Menu & Cart Button */}
            <div className="flex items-center md:hidden">
              <div className="relative mr-2 group">
                <Link to="/cart">
                  <Button variant="ghost" size="icon">
                    <FontAwesomeIcon icon={faCartShopping} className="h-6 w-6 transition-colors group-hover:text-kibo-purple" />
                  </Button>
                </Link>
                {itemCount > 0 && (
                  <span
                    key={`mobile-cart-count-${itemCount}`}
                    className="absolute top-0 right-0 bg-kibo-orange text-white text-[11px] rounded-full h-4 min-w-[18px] px-[5px] flex items-center justify-center z-10 ring-2 ring-white shadow-sm transition-colors group-hover:text-kibo-purple motion-safe:animate-[bounce_0.25s_ease-in-out_1]"
                  >
                    {itemCount}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <nav className="flex flex-col space-y-2">
                <Button variant="ghost" className="justify-start">KIBO</Button>
                <Button variant="ghost" className="justify-start">For Educators</Button>
                <Button variant="ghost" className="justify-start">Resources</Button>
                <Link to="/shop">
                  <Button variant="ghost" className="justify-start w-full">Shop</Button>
                </Link>

                {/* Mobile Login/Logout Button */}
                {user ? (
                  <div className="border-t pt-2">
                    <Link to="/account">
                      <Button variant="ghost" className="justify-start w-full flex flex-col items-start py-3 h-auto">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span className="text-sm font-medium">{user.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-5">{user.email}</span>
                      </Button>
                    </Link>
                    {user.isAdmin && (
                      <Link to="/admin">
                        <Button
                          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 justify-start w-full mt-2 group"
                        >
                          <span className="group-hover:text-kibo-purple">Admin Panel</span>
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => logout()}
                      className="justify-start w-full mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="border-t pt-2">
                    <Link to="/login">
                      <Button variant="ghost" className="justify-start w-full">
                        <User className="h-4 w-4 mr-2" />
                        Login
                      </Button>
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
        <NewsTicker />
        <MegaMenu activeMenu={activeMenu} closeMenu={closeMenu} />
      </header>
    </>
  );
};

export default Header;
