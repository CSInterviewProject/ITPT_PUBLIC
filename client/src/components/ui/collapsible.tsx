// 파일 목적: collapsible용 재사용 UI 프리미티브를 정의한다.
"use client";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible@1.1.3";

// 함수 목적: Collapsible 컴포넌트를 렌더링한다.
function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

// 함수 목적: CollapsibleTrigger 컴포넌트를 렌더링한다.
function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  );
}

// 함수 목적: CollapsibleContent 컴포넌트를 렌더링한다.
function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
