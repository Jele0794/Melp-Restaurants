import { Router, Request, NextFunction } from "express";
import { Response } from "express";
import { Restaurant } from "../../models/restaurant";
import { MariaDBService } from "../../persistence/maria-db-service";
import { Observable } from "rxjs";
import { take } from 'rxjs/operators';
import { RestaurantMapper } from "../../utils/restaurant-mapper";

export class RestaurantApi {

    constructor(private router: Router) {
        // log
        console.log("[IndexRoute::create] Creating restaurant api.");

        // create post method.
        this.createRoute(this.router);
        // create get method.
        this.findRoute(this.router);
        // create update method.
        this.updateRoute(this.router);
        // create delete method.
        this.deleteRoute(this.router);
        // create options method.
        this.optionsRoute(this.router);
    }

    /**
     * Create a post method to create one or more restaurants
     * on a database.
     *
     * @param router Express Router object.
     */
    private createRoute(router: Router) {
        // create restaurant.
        router.post("/restaurant", (req: Request, res: Response, next: NextFunction) => {
            let restaurants: Restaurant[] = this.getRestaurantArray(req.body);
            // validate that restaurants array is not empty.
            if (restaurants.length === 0) {
                res.status(400).send('Error: To create a restaurant, it is needed data.')
            }
            // create restaurant on database.
            res.json(restaurants);
        });
    }

    /**
     * Create a get method that accepts an ID or a name as queries to then
     * query for restaurants on a database.
     * 
     * If any query is given, return all restaurants.
     *
     * @param router Express Router object.
     */
    private findRoute(router: Router) {
        // search and return an array of matching restaurants.
        router.get('/restaurant', (req: Request, res: Response, next: NextFunction) => {
            let restaurants: Restaurant[] = [];
            if (req.query.id) {
                // search database by id and return an array of matching restaurants
                console.log(req.query.id);
                res.send('ID received.');
            } else if (req.query.name) {
                // search database by name and return an array of matching restaurants
                console.log(req.query.name);
                res.send('Name received.');
            // return every restaurant.
            } else {
                MariaDBService.findAll<Restaurant>('K_RESTAURANT', RestaurantMapper.fromDbToModel)
                    // just take 1 value.
                    .pipe( take(1) )
                    // subscribe to observable
                    .subscribe((restaurantsResult: Restaurant[]) => {
                        // assign result to restaurants.
                        restaurants = restaurantsResult;
                        // if restaurants is undefined, send server error.
                        if (!restaurants) {
                            res.status(500).send('Error: Server Error');
                        }
                        // else, send result.
                        res.json(restaurants);                            
                    });
            }
        });
    }

    /**
     * Create a put method that receives one or more restaurants to update
     * on a database.
     *
     * @param router Express Router object.
     */
    private updateRoute(router: Router) {
        router.put('/restaurant', (req: Request, res: Response, next: NextFunction) => {
            let restaurants: Restaurant[] = this.getRestaurantArray(req.body);
            // validate that restaurants array is not empty.
            if (restaurants.length === 0) {
                res.status(400).send('Error: To update data, the system needs at least one restaurant.')
            }
            // iterate restaurants list and update each on database.
        });
    }

    /**
     * Create a delete method that receives one or more restaurants to delete
     * on a database.
     *
     * @param router Express Router object.
     */
    private deleteRoute(router: Router) {
        router.delete('/restaurant', (req: Request, res: Response, next: NextFunction) => {
            let restaurants: Restaurant[] = this.getRestaurantArray(req.body);
            // validate that restaurants array is not empty.
            if (restaurants.length === 0) {
                res.status(400).send('Error: To delete data, the system needs at least one restaurant.')
            }
            // iterate restaurants list and delete each on database.
        })
    }

    private optionsRoute(router: Router) {
        router.options('restaurant', (req: Request, res: Response, next: NextFunction) => {
            res.setHeader('Allow', 'OPTIONS, GET, PUT, POST, DELETE');
            res.send('Allow: OPTIONS, GET, PUT, POST, DELETE');
        })
    }

    /**
     * Validate that the argument received is an array. If it is not,
     * create one and return it.
     *
     * @param requestBody Request body.
     */
    private getRestaurantArray(requestBody: Restaurant | Restaurant[]): Restaurant[] {
        let restaurants: Restaurant[];
        // validate if requestBody is an array.
        if (Array.isArray(requestBody)) {
            // assign requestBody to restaurants
            restaurants = requestBody;
        } else {
            // create an empty array
            restaurants = [];
            // push the requestBody object
            restaurants.push(requestBody);
        }
        return restaurants;
    }
}