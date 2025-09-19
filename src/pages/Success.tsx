import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "react-router-dom";
import { formatCurrency } from "@/lib/format";
import dayjs from "dayjs";

type Summary = {
  date: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  itemsCount: number;
};

export default function Success(){
  const loc = useLocation() as unknown as { state?: { summary?: Summary }};
  const s: Summary | undefined = loc?.state?.summary;
  const dateStr = s ? dayjs(s.date).format("DD MMMM YYYY, HH:mm") : dayjs().format("DD MMMM YYYY, HH:mm");
  const subtotal = s?.subtotal ?? 0;
  const deliveryFee = s?.deliveryFee ?? 0;
  const serviceFee = s?.serviceFee ?? 0;
  const total = s?.total ?? subtotal + deliveryFee + serviceFee;
  const itemsCount = s?.itemsCount ?? 0;
  const method = s?.paymentMethod ?? "—";

  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center px-4 mt-8 mx-auto sm:my-auto">
      <div className="flex gap-x-[15px] mb-7">

      <svg
            xmlns='http://www.w3.org/2000/svg'
            className='size-10 sm:size-[42px] font-semibold text-lg flex items-center gap-[15px] text-brand'
            
            viewBox='0 0 42 42'
            fill='none'
          >
            <mask
              id='mask0_39423_4673'
              style={{ maskType: 'luminance' }}
              maskUnits='userSpaceOnUse'
              x='0'
              y='0'
              width='42'
              height='42'
            >
              <path d='M42 0H0V42H42V0Z' fill='white' />
            </mask>
            <g mask='url(#mask0_39423_4673)'>
              <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M22.5 0H19.5V13.2832L14.524 0.967222L11.7425 2.09104L16.8474 14.726L7.21142 5.09009L5.09011 7.21142L14.3257 16.447L2.35706 11.2178L1.15596 13.9669L13.8202 19.5H0V22.5H13.8202L1.15597 28.0331L2.35706 30.7822L14.3257 25.553L5.09011 34.7886L7.21142 36.9098L16.8474 27.274L11.7425 39.909L14.524 41.0327L19.5 28.7169V42H22.5V28.7169L27.476 41.0327L30.2574 39.909L25.1528 27.274L34.7886 36.9098L36.9098 34.7886L27.6742 25.553L39.643 30.7822L40.8439 28.0331L28.1799 22.5H42V19.5H28.1797L40.8439 13.9669L39.643 11.2178L27.6742 16.447L36.9098 7.2114L34.7886 5.09009L25.1528 14.726L30.2574 2.09104L27.476 0.967222L22.5 13.2832V0Z'
                fill='currentColor'
              />
            </g>
          </svg>
          <div className='block text-[32px] font-extrabold leading-[42px]'>
            Foody
          </div>
      </div>

      <div className="relative">
        {/* side notches */}
        <span className="block absolute -left-3 top-39 sm:top-40 -translate-y-1/2 size-6 rounded-full bg-neutral-50 border border-neutral-50" aria-hidden="true" />
        <span className="absolute -right-3 top-39 sm:top-40 -translate-y-1/2 size-6 rounded-full bg-neutral-50 border border-neutral-50" aria-hidden="true" />
        <span className="absolute -left-3 top-90 sm:top-95 -translate-y-1/2 size-6 rounded-full bg-neutral-50 border border-gray-50" aria-hidden="true" />
        <span className="absolute -right-3 top-90 sm:top-95 -translate-y-1/2 size-6 rounded-full bg-neutral-50 border border-neutral-50" aria-hidden="true" />

        <Card className="max-w-md w-full sm:w-[428px] text-left rounded-2xl shadow-sm">
          <CardContent className="p-4 sm:p-0">
            <div className="text-center flex flex-col items-center ">
              
              <img src="/icongreen.svg" alt="icon" width='64' height='64' className=""/>

              <div className="text-lg sm:text-[20px] font-extrabold pt-[2px] leading-[34px]">Payment Success</div>
              
              <p className="text-gray-950 font-normal text-sm mt-1 leading-[30px] sm:text-[16px] pb-[6px]">Your payment has been successfully processed.</p>
            </div>
            <div className="border-t border-dashed border-neutral-200" />
            <div className="px-5 pt-5 space-y-4 text-[16px] text-gray-950">

              <div className="flex justify-between"><span className="text-gray-950 text-sm sm:text-[16px]">Date</span><span className="text-sm sm:text-[16px] font-semibold sm:font-bold">{dateStr}</span></div>
              <div className="flex justify-between"><span className="text-gray-950 text-sm sm:text-[16px]">Payment Method</span><span className="text-sm sm:text-[16px] font-semibold sm:font-bold">{method}</span></div>
              <div className="flex justify-between"><span className="text-gray-950 text-sm sm:text-[16px]">Price ({itemsCount} {itemsCount===1?'item':'items'})</span><span className="text-sm sm:text-[16px] font-semibold sm:font-bold">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-950 text-sm sm:text-[16px]">Delivery Fee</span><span className="text-sm sm:text-[16px] font-semibold sm:font-bold">{formatCurrency(deliveryFee)}</span></div>
              <div className="flex justify-between"><span className="text-gray-950 text-sm sm:text-[16px]">Service Fee</span><span className="text-sm sm:text-[16px] font-semibold sm:font-bold">{formatCurrency(serviceFee)}</span></div>
              <div className="border-t border-dashed border-neutral-200 pt-3 flex justify-between font-normal text-[16px] sm:text-lg">
                <span>Total</span><span className="text-[16px] sm:text-lg font-extrabold">{formatCurrency(total)}</span>
              </div>
              <Button asChild className="w-full mt-2 h-11 rounded-full bg-[var(--color-brand,#D22B21)]">
                <Link to="/orders">See My Orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
