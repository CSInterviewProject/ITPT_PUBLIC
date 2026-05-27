// 파일 목적: skeleton용 재사용 UI 프리미티브를 정의한다.
import { cn } from "./utils";

// 함수 목적: Skeleton 컴포넌트를 렌더링한다.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
