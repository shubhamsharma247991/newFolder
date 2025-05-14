import { UserButton } from '@clerk/clerk-react';
import { Loader } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
const ProfileContainer = () => {
  const {isSignedIn , isLoaded} = useAuth() ;
  if(!isLoaded){
    return (
      <div className='flex items-center'>
        <Loader className='min-w-4 min-h-4 animate-spin text-emerald-500'/>
      </div>
    )
  }

  return (
    <div className='flex items-center gap-6'>
       {isSignedIn ? 
        <UserButton afterSignOutUrl='/'/>
        :
        (
          <>
            <Link to={'/signin'}>
              <Button variant="outline" size={'sm'}>Sign In</Button>
            </Link>
            <Link to={'/signup'}>
              <Button size={'sm'}>Sign Up</Button>
            </Link>
          </>
        )
      }
    </div>
  )
}

export default ProfileContainer
