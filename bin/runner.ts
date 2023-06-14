#!/usr/bin/env node

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppStack } from '../lib/infra/appStack';

const app = new cdk.App();

export const stackName = 'mightytigersbot-v2-stack';
new AppStack(app, stackName, {});