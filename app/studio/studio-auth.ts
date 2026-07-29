import { notFound } from "next/navigation";
import {
  chatGPTSignInPath,
  getChatGPTUser,
  requireChatGPTUser,
} from "../chatgpt-auth";
import type { ChatGPTUser } from "../chatgpt-auth";
import { contentServices } from "../composition/content";
import { studioJson } from "./studio-response";

export async function requireStudioUser(returnTo: string) {
  const user = await requireChatGPTUser(returnTo);
  if (!await contentServices.studio.access.canEdit(user.email)) notFound();
  return user;
}

export async function authorizeStudioApi(): Promise<
  { authorized: true; user: ChatGPTUser } |
  { authorized: false; response: Response }
> {
  const user = await getChatGPTUser();
  if (!user) {
    return {
      authorized: false,
      response: studioJson(
        {
          error: "需要登录后才能管理内容。",
          signIn: chatGPTSignInPath("/studio"),
        },
        { status: 401 },
      ),
    };
  }
  if (!await contentServices.studio.access.canEdit(user.email)) {
    return {
      authorized: false,
      response: studioJson(
        { error: "当前账号没有内容管理权限。" },
        { status: 403 },
      ),
    };
  }
  return { authorized: true, user };
}
