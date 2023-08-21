import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { FileModule } from 'src/file/file.module';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop()
  name: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ unique: [true, 'Duplicate email entered'] })
  email: string;

  @Prop()
  picture: string;

  @Prop()
  isAdmin: boolean;

  @Prop()
  isPublished: boolean;

  @Prop()
  password: string;

  @Prop()
  keySecret: string;

  @Prop()
  dateOfBirth: string;

  @Prop()
  phoneNumber: string;

  @Prop({ type: Object })
  files: string;

  @Prop()
  gender: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
