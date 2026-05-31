import { Model } from "@tailflow/laravel-orion/lib/model";
import { UserAttributes } from "../../interfaces/user-attributes.interface";
import { UserComputed } from "../../interfaces/user-computed.interface";
import { UserRelations } from "../../interfaces/user-relations.interface";


export class Users extends Model<
  UserAttributes,
  UserComputed,
  UserRelations
> {


  public $resource(): string {
    return 'users';
  }

  protected override $keyName: string = 'id';


}
