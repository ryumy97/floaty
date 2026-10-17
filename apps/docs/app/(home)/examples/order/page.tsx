import OrderShowcase from '@/components/showcases/order';

export const metadata = { title: 'Travelling order summary' };

export default function OrderExamplePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <OrderShowcase />
    </div>
  );
}
