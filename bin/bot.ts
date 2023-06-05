#!/usr/bin/env node

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BotStack, } from '../lib/bot-stack';

const app = new cdk.App();

export const stackName = 'mightytigersbot-v2-stack';
new BotStack(app, stackName, {});