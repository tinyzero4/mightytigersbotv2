#!/usr/bin/env node

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { App } from '../lib/infra/app';

const app = new cdk.App();

export const stackName = 'mightytigersbot-v2-stack';
new App(app, stackName, {});