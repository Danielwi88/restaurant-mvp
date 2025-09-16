import {
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { MapPinIcon } from "lucide-react";
function UserMenuContent({
  name,
  avatarUrl,
  onClickProfile,
  onClickAddress,
  onClickOrders,
  onClickLogout,
}: {
  name: string
  avatarUrl: string | null | undefined
  onClickProfile: () => void
  onClickAddress?: () => void
  onClickOrders: () => void
  onClickLogout: () => void
}) {
  return (
    <DropdownMenuContent className='rounded-2xl'>
      <DropdownMenuLabel>
        <div
          className='flex items-center gap-2 cursor-pointer'
          role='button'
          aria-label='Go to profile'
          onClick={onClickProfile}
        >
          <Avatar className='size-9 sm:size-10 shrink-0 aspect-square bg-black p-0'>
            <AvatarImage
              src={avatarUrl || undefined}
              alt={name}
              className='object-contain object-center'
            />
          </Avatar>

          <div className='font-bold text-[16px] sm:text-lg leading-[30px]'>
            {name}
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => onClickAddress && onClickAddress()}>
        <div className='flex items-center gap-3 cursor-pointer'>
          <MapPinIcon className='size-4 sm:size-5 ' />
          <span className='text-sm sm:text-[16px] font-medium text-gray-950 '>
            Delivery Address
          </span>
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={onClickOrders}>
        <div className='flex items-center gap-3 cursor-pointer'>
          <img src='/file-05.svg' alt='file' width='20' height='20' />
          <span className='text-sm sm:text-[16px] text-gray-950  font-medium '>
            My Orders
          </span>
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={onClickLogout}>
        <div className='flex items-center gap-3 text-gray-950 cursor-pointer'>
          <img
            src='/arrow-circle-broken-left.svg'
            alt='arrow'
            width='20'
            height='20'
          />
          <span className='text-sm sm:text-[16px] font-medium '>
            Logout
          </span>
        </div>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

export default UserMenuContent;
