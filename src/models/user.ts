import * as graphql from 'graphql';
import { Prop } from '@nestjs/mongoose';
import { IsEmail, MinLength } from 'class-validator';
import { Property, Entity, Thunk, ExcludeOnDatabase } from '../../lib';
import { Field } from '@nestjs/graphql';

@Entity()
export class User {
  @Thunk(Field(() => graphql.GraphQLID), { scopes: ['output', 'update'] })
  @ExcludeOnDatabase()
  id: string;

  @Property()
  name: string;

  @Prop({ unique: true })
  @Thunk(Field(), { scopes: ['create', 'output'] })
  @Thunk(Field(() => graphql.GraphQLString, { nullable: true }), { scopes: 'update' })
  @Thunk(IsEmail(), { scopes: ['input'] })
  email: string;

  @Thunk(Field(), { scopes: ['create'] })
  @Thunk(MinLength(5), { scopes: ['create'] })
  password: string;
}
