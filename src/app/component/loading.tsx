
import Image from 'next/image';
export default function Loading() {
    return(
  <>
      <div className="flex justify-start items-center space-x-2 mt-6 text-zinc-400">
        <Image
          alt="loading"
          src="/assets/orb2.png"
          width={18}
          height={18}
          className="animate-spin"
        />
  
        <p>I&apos;m thinking...</p>
      </div></>
    )
}