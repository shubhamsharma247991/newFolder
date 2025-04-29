import {cn} from '@/lib/utils' ;
interface ContainerProps{
  children : React.ReactNode ,
  className?:String ;
}
export const Container = ({children , className} : ContainerProps )=>{
  return <div className={cn("container mx-auto px-4 md:px-8 py-8 w-full",className)}>{children}</div>
}