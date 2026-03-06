import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react';
import heroBackground from '@/assets/hero/bg-kinderlab-block.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; captchaToken?: string }>({});

  const { login, isLoading, lastAuthErrorCode } = useAuth();
  const navigate = useNavigate();
  const isCaptchaRequired = lastAuthErrorCode === 'CAPTCHA_REQUIRED';


  const validateForm = () => {
    const newErrors: { email?: string; password?: string; captchaToken?: string } = {};

    if (!email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isCaptchaRequired && !captchaToken.trim()) {
      newErrors.captchaToken = 'Captcha token is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const success = await login(email, password, isCaptchaRequired ? captchaToken.trim() : undefined);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-black bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${heroBackground})` }}
    >
      <div className="absolute inset-0 bg-black/50"></div>

      <Card className="w-full max-w-md relative z-10 bg-orange-100 text-black border-purple-900">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-black">Sign In</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-black">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`bg-purple-100 text-black placeholder:text-gray-600 border-purple-900 ${errors.email ? 'border-orange-500' : ''}`}
              />
              {errors.email && <p className="text-sm text-purple-900">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-black">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`bg-purple-100 text-black placeholder:text-gray-600 border-purple-900 ${errors.password ? 'border-orange-500' : ''}`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-purple-900">{errors.password}</p>}
            </div>

            {isCaptchaRequired && (
              <div className="space-y-2 rounded-lg border border-orange-300 bg-orange-50 p-3">
                <div className="flex items-start gap-2 text-sm text-orange-900">
                  <ShieldAlert className="mt-0.5 h-4 w-4" />
                  <p>Additional verification is required. Paste the provider-issued captcha token below.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="captchaToken" className="text-black">Captcha Token</Label>
                  <Input
                    id="captchaToken"
                    type="text"
                    placeholder="Paste captcha token"
                    value={captchaToken}
                    onChange={(e) => setCaptchaToken(e.target.value)}
                    className={`bg-white text-black placeholder:text-gray-500 ${errors.captchaToken ? 'border-orange-500' : 'border-orange-200'}`}
                  />
                  {errors.captchaToken && <p className="text-sm text-orange-900">{errors.captchaToken}</p>}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <button type="submit" className="w-full no-hover-effect" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <p className="text-sm text-gray-600 text-center">
              Don't have an account?{' '}
              <Link to="/register" className="text-orange-400 hover:text-kibo-purple hover:no-underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
