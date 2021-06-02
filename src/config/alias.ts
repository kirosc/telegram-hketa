import path from 'path';
import moduleAlias from 'module-alias';

moduleAlias.addAlias('@root', path.resolve(__dirname, '..'));
moduleAlias.addAlias('@src', path.resolve(__dirname, '../../src'));
moduleAlias.addAlias('@scenes', path.resolve(__dirname, '../scenes'));
moduleAlias.addAlias('@services', path.resolve(__dirname, '../services'));
moduleAlias.addAlias('@interfaces', path.resolve(__dirname, '../interfaces'));
