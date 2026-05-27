// 파일 목적: aspect-ratio용 재사용 UI 프리미티브를 정의한다.
"use client";

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio@1.1.2";

// 함수 목적: AspectRatio 컴포넌트를 렌더링한다.
function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio };
