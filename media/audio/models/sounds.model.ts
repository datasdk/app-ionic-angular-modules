import { Model } from "@tailflow/laravel-orion/lib/model";
import { SoundAttributes } from "../interfaces/sound-attributes.interface";
import { SoundComputed } from "../interfaces/sound-computed.interface";
import { SoundRelations } from "../interfaces/sound-relations.interface";


export class Sounds extends Model<
  SoundAttributes,
  SoundComputed,
  SoundRelations
> {

  public $resource(): string {
    return "sounds";
  }

  protected override $keyName: string = "id";
}
