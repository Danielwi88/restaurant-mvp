import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-16 bg-[#0E1116] text-white/90">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-5 lg:px-0 py-10 sm:py-20 sm:flex justify-between">
        <div className="">
          <div className="flex items-center gap-[15px] font-semibold text-lg">
            <svg
            xmlns='http://www.w3.org/2000/svg'
            className='size-10 sm:size-[42px] font-semibold text-lg flex items-center  text-brand'
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
          <div className='text-[32px] font-extrabold leading-[42px]'>
            Foody
          </div>
            
            
          </div>
          <p className="mt-3 text-[16px] leading-[30px] font-regular text-gray-25 w-[380px]">
            Enjoy homemade flavors & chef's signature dishes, freshly prepared every day. Order online or visit our nearest branch.
          </p>
          <p className="mt-4 sm:mt-10 mb-5">Follow on Social Media</p>
          <div className="flex gap-3 mt-4 text-white/70 mb-6"> 

            <span>
              <img src="/fbicon.svg" alt="fb" width="40" height="40"/>
              </span>
              <span>
                <img src="/instaicon.svg" alt="insta" width="40" height="40"/></span>
                <span>
                  <img src="/linked.svg" alt="link" width="40" height="40"/>
                  </span>
                  <span>
                    <img src="/tiktok.svg" alt="fb" width="40" height="40"/></span>
          </div>
            
        </div>


        <div className="grid grid-cols-2 sm:block ">
        <div className="sm:w-[200px] max-w-[200px] text-neutral-25 leading-[28px] space-y-4 ">
          <div className="text-sm sm:text-[16px] leading-[30px] font-extrabold mb-4 sm:mb-5">Explore</div>
          <ul className="space-y-4 text-sm text-neutral-25 leading-[28px]">
            <li><Link to="/categories">All Food</Link></li>
            <li><Link to="/categories">Nearby</Link></li>
            <li><Link to="/">Discount</Link></li>
            <li><Link to="/">Best Seller</Link></li>
            <li><Link to="/">Delivery</Link></li>
            <li><Link to="/">Lunch</Link></li>
          </ul>
          
          
        
        </div>
        <div className="sm:hidden text-neutral-25 leading-[28px] space-y-4">

        <div className="sm:w-[200px] max-w-[200px] text-sm sm:text-[16px] leading-[30px] font-extrabold mb-4 sm:mb-5">Help</div>
          <ul className="space-y-4 text-sm text-neutral-25 leading-[28px]">
            <li><Link to="/">How to Order</Link></li>
            <li><Link to="/">Payment Methods</Link></li>
            <li><Link to="/orders">Track My Order</Link></li>
            <li><Link to="/">FAQ</Link></li>
            <li><Link to="/">Contact Us</Link></li>
          </ul>
          <div className="flex justify-start self-end text-xs text-white/40 mt-10">© Danielwi_wph_010</div>
        
        </div>

        </div>


        <div className="hidden sm:block text-neutral-25 leading-[28px] space-y-4">

<div className="sm:w-[200px] max-w-[200px] text-sm sm:text-[16px] leading-[30px] font-extrabold mb-4 sm:mb-5">Help</div>
          <ul className="space-y-4 text-sm text-neutral-25 leading-[28px] ">
            <li><Link to="/">How to Order</Link></li>
            <li><Link to="/">Payment Methods</Link></li>
            <li><Link to="/orders">Track My Order</Link></li>
            <li><Link to="/">FAQ</Link></li>
            <li><Link to="/">Contact Us</Link></li>
          </ul>
          <div className="flex justify-start self-end text-xs text-white/40 mt-10">© Danielwi_wph_010</div>

        
        </div>
        
      </div>
    </footer>
  )
}
