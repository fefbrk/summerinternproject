import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ExternalLink, ShieldAlert } from 'lucide-react';

const PaymentMethods = () => {
  return (
    <Card className="bg-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Provider Pending
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-gray-800">
        <div className="flex items-start gap-3 rounded-lg border border-orange-300 bg-orange-50 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-orange-700" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-orange-900">Payment methods are disabled before PSP selection</span>
              <Badge className="bg-orange-600 text-white hover:bg-orange-600">Pre-PSP</Badge>
            </div>
            <p>
              Card, CVV, PayPal, and provider token management will be enabled only after the project is wired to a real payment provider.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-kibo-purple/20 bg-white/80 p-4">
          <h3 className="mb-2 font-semibold text-kibo-purple">What works today</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>Checkout creates an order with <strong>payment pending</strong>.</li>
            <li>Purchase orders can be captured as offline payment intent metadata.</li>
            <li>Admin users can track payment snapshot and block fulfillment until payment becomes <strong>paid</strong>.</li>
          </ul>
        </div>

        <div className="rounded-lg border border-kibo-purple/20 bg-white/80 p-4">
          <h3 className="mb-2 font-semibold text-kibo-purple">What will be added after PSP selection</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>Provider-hosted checkout or tokenized card entry</li>
            <li>Webhook-driven payment event processing</li>
            <li>Saved payment instruments backed by provider tokens</li>
          </ul>
        </div>

        <p className="flex items-center gap-2 text-xs text-gray-600">
          <ExternalLink className="h-4 w-4" />
          This route is intentionally preserved so deep links stay stable while payment infrastructure is pending.
        </p>
      </CardContent>
    </Card>
  );
};

export default PaymentMethods;
