import { notFound } from "next/navigation";
import {
  chatGPTSignInPath,
  getChatGPTUser,
  requireChatGPTUser,
} from "../chatgpt-auth";
import { contentServices } from "../composition/content";

export async function requireStudioUser(returnTo: string) {
  const user = await requireChatGPTUser(returnTo);
  if (!await contentServices.studio.access.canEdit(user.email)) notFound();
  return user;
}

export async function authorizeStudioApi(): Promise<
  { authorized: true } | { authorized: false; response: Response }
> {
  const user = await getChatGPTUser();
  if (!user) {
    return {
      authorized: false,
      response: Response.json(
        {
          error: "需要登录后才能管理内容。",
          signIn: chatGPTSignInPath("/studio"),
        },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      ),
    };
  }
  if (!await contentServices.studio.access.canEdit(user.email)) {
    return {
      authorized: false,
      response: Response.json(
        { error: "当前账号没有内容管理权限。" },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      ),
    };
  }
  return { authorized: true };
}
