import { Client } from "../Client";
import { Profile } from "../Profile";

export class ProfileManager {
  client: Client;
  cache: Profile[] = [];

  constructor(client: Client) {
    this.client = client;
  }

  async fetch(data: ProfileFetchData) {
    let existing = this.cache.find((profile) =>
      (Object.keys(data) as Array<keyof ProfileFetchData>).some(
        key => profile[key] === data[key]
      )
    );

    if (!existing) {
      existing = new Profile(this.client, data);
      await existing.fetch();
      this.cache.push(existing);
      this.client.emit("profileCreate", existing);
    }
    return existing;
  }
}

export interface ProfileUsernameFetchData {
  username: string,
  userId?: string
}

export interface ProfileUserIdFetchData {
  userId: string
  username?: string
}

export type ProfileFetchData = ProfileUsernameFetchData | ProfileUserIdFetchData
