import { createConnection, Connection, ConnectionConfig, QueryFunction } from "mysql";
import { Observable, Subject } from 'rxjs';

export class MariaDBService {

    /**
     * Query select * from tableName, map the result
     * and add it to a subject, which is returned.
     *
     * @param tableName DB table name.
     * @param mapper Mapper function to use.
     */
    public static findAll<T>(tableName: string, mapper?: any): Observable<T[]> {
        let connection: Connection = this.generateConnection();
        let subject: Subject<T[]> = new Subject();
        
        connection.query('SELECT * FROM ??', [tableName], (error, results) => {
            if (error) {
                console.error(error)
                this.safeCloseConnection(connection)
                return undefined;
            }
            let mappedResults: any = [];
            results.forEach((res: any) => {
                mappedResults.push(mapper(res))
            });
            subject.next(mappedResults);
        })
        // on finish, close connection.
        .on('end', () => this.safeCloseConnection(connection));

        return subject.asObservable();
    }

    /**
     * Create a db connection.
     */
    private static generateConnection(): Connection {
        let connectionConfig: ConnectionConfig = {
            host: 'localhost',
            port: 3306,
            database: 'MelpRestaurantsApp',
            user: 'MelpDBAdmin',
            password: 'm3194ppDB'
        };
        return createConnection(connectionConfig);
    }

    /**
     * If connection exists, close it.
     *
     * @param connection Connection.
     */
    private static safeCloseConnection(connection: Connection) {
        if (connection) {
            connection.end();
        }
    }
}
