import { Model } from 'objection';
import { Column, Reference, Table } from 'objection-annotations';

import { DBUser } from './user-role';

@Table('files', {
    uniques: ['fileName'],
    indexes: [
        'uploaderUserId', 'fileType', 'tempPath', 'fileMime',
    ],
})
export class DBFile extends Model {
    @Column('bigIncrements')
    id: number;

    @Reference(() => DBUser)
    uploaderUserId: number;

    @Column('string', { required: true, schema: { maxLength: 50 } })
    fileName: string;

    @Column('string', { required: true, schema: { maxLength: 50 } })
    fileTitle: string;

    @Column('integer')
    fileType: number;

    @Column('string', { schema: { maxLength: 20 } })
    fileExtension: string;

    @Column('string', { schema: { maxLength: 50 } })
    fileMime: string;

    @Column('string', { schema: { maxLength: 255 } })
    tempPath: string;
}
