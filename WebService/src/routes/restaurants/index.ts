import { Router, Request, NextFunction } from "express";
import { Response } from "express";
import { Restaurant, Statistics } from "../../models/restaurant";
import { MariaDBService } from "../../persistence/maria-db-service";
import { Observable } from "rxjs";
import { take } from 'rxjs/operators';
import { RestaurantMapper } from "../../utils/restaurant-mapper";
import { Constants } from "../../utils/constants";

export class RestaurantApi {

    constructor(private router: Router) {
        // log
        console.log("[IndexRoute::create] Creating restaurant api.");

        // create post method.
        this.createRoute(this.router);
        // create get method.
        this.findRoute(this.router);
        // create get method to search by position.
        this.searchByPosition(this.router);
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
                res.status(400).send('Error: To create a restaurant, it is needed data.');
            } else if (this.validatesRatingRange(restaurants).length > 0) {
                res.status(400).json({
                    error: 'Error: Some ratings are above or below the range.',
                    restaurants: this.validatesRatingRange(restaurants)
                });
            }
            // create restaurant on database.
            MariaDBService.create<Restaurant>(Constants.K_RESTAURANT, restaurants)
                .pipe(take(1))
                .subscribe((restaurantsResult: Restaurant[]) => {
                    // assign result to restaurants.
                    restaurants = restaurantsResult;
                    // if restaurants is undefined, send server error.
                    if (!restaurants) {
                        res.status(500).send('Error: Server Error or duplicated data.');
                    }
                    // else, send result.
                    res.json(restaurants.length === 1 ? restaurants[0] : restaurants);
                });
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
                MariaDBService.findBy<Restaurant>(Constants.K_RESTAURANT, 'ID_RESTAURANT', req.query.id, true, RestaurantMapper.fromDbToModel)
                    // just take 1 value.
                    .pipe(take(1))
                    // subscribe to observable
                    .subscribe((restaurantsResult: Restaurant[]) => {
                        // assign result to restaurants.
                        restaurants = restaurantsResult;
                        // if restaurants is undefined, send server error.
                        if (!restaurants) {
                            res.status(500).send('Error: Server Error');
                        }
                        // else, send result.
                        res.json(restaurants.length === 1 ? restaurants[0] : []);
                    });
            } else if (req.query.name) {
                // search database by name and return an array of matching restaurants
                MariaDBService.findBy<Restaurant>(Constants.K_RESTAURANT, Constants.RESTAURANT_TABLE.DS_NAME, req.query.name, false, RestaurantMapper.fromDbToModel)
                    // just take 1 value.
                    .pipe(take(1))
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
            // return every restaurant.
            } else {
                MariaDBService.findAll<Restaurant>(Constants.K_RESTAURANT, RestaurantMapper.fromDbToModel)
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
     * Get a latitude, longitude and a radious to search for restaurants
     * in that area.
     * 
     * @param router Express Router object.
     */
    private searchByPosition(router: Router) {
        router.get('/restaurant/statistics', (req: Request, res: Response, next: NextFunction) => {
            let restaurants: Restaurant[] = [];
            let statistics: Statistics = new Statistics();
            if (!req.query.latitude || !req.query.longitude || !req.query.radius ) {
                res.status(400).send('Error: A latitud, longitude and a radious is needed.')
            }
            let lat: number = parseFloat(req.query.latitude);
            let lng: number = parseFloat(req.query.longitude);
            let radius: number = parseInt(req.query.radius);
            MariaDBService.radiousSearch<Restaurant>(Constants.K_RESTAURANT, lat, lng, radius, RestaurantMapper.fromDbToModel)
                .pipe(take(1))
                .subscribe((restaurantsResult: Restaurant[]) => {
                    // assign result to restaurants.
                    restaurants = restaurantsResult;
                    // if restaurants is undefined, send server error.
                    if (!restaurants) {
                        res.status(500).send('Error: Server Error');
                    }
                    // else, send result.
                    res.json(this.getStatistics(restaurants));
                });
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
            let restaurant: Restaurant = RestaurantMapper.fromObjToModel(req.body);
            let columns: string[] = [];
            // validate that restaurants array is not empty.
            if (!restaurant) {
                res.status(400).send('Error: To update data, the system needs at least one restaurant.')
            }
            for(let key in Constants.RESTAURANT_TABLE) {
                columns.push(Constants.RESTAURANT_TABLE[key]);
            }
            
            MariaDBService.update<Restaurant>(Constants.K_RESTAURANT, restaurant, columns, Constants.ID_RESTAURANT, restaurant.id, RestaurantMapper.fromModelToDB)
            .pipe(take(1))
            .subscribe((restaurantResult: Restaurant) => {
                // assign result to restaurants.
                restaurant = restaurantResult;
                // if restaurants is undefined, send server error.
                if (!restaurant) {
                    res.status(500).send('Error: Server Error.');
                }
                // else, send result.
                res.json(restaurant);
            });
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
            let restaurant: Restaurant = RestaurantMapper.fromObjToModel(req.body);
            // validate that restaurants array is not empty.
            if (!restaurant) {
                res.status(400).send('Error: To delete data, the system needs at least one restaurant.')
            }

            MariaDBService.delete<Restaurant>(Constants.K_RESTAURANT, Constants.ID_RESTAURANT, restaurant.id)
            .pipe(take(1))
                .subscribe((idDeleted: string) => {
                    // if restaurants is undefined, send server error.
                    if (!idDeleted || idDeleted === '') {
                        res.status(500).send('Error: Server Error.');
                    }
                    // else, send result.
                    res.json(`${idDeleted} was deleted`);
                });
            // iterate restaurants list and delete each on database.
        });
    }

    private optionsRoute(router: Router) {
        router.options('restaurant', (req: Request, res: Response, next: NextFunction) => {
            res.setHeader('Allow', 'OPTIONS, GET, PUT, POST, DELETE');
            res.send('Allow: OPTIONS, GET, PUT, POST, DELETE');
        });
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
            restaurants = requestBody.map(req => RestaurantMapper.fromObjToModel(req));
        } else {
            // create an empty array
            restaurants = [];
            // push the requestBody object
            restaurants.push(RestaurantMapper.fromObjToModel(requestBody));
        }
        return restaurants;
    }

    /**
     * Calculate some statistics.
     *
     * @param restaurants Restaurant array.
     */
    private getStatistics(restaurants: Restaurant[]): Statistics {
        let statistics: Statistics = new Statistics();
        let ratingsArray: number[] = restaurants.map(restaurant => restaurant.rating)
        let ratingSum: number = ratingsArray
            .reduce((rating, current) => rating + current);
        let sqrDiffs: number[];
        let diffsAvr: number;

        statistics.count = restaurants.length;
        statistics.avg = ratingSum / statistics.count;

        sqrDiffs = ratingsArray
            .map(rating => Math.pow(rating - statistics.avg, 2));
        diffsAvr = sqrDiffs.reduce((diff, curr) => diff + curr) / sqrDiffs.length;

        statistics.std = Math.sqrt(diffsAvr);

        return statistics;
    }

    /**
     * Validate that the rating is correct.
     *
     * @param restaurants Restaurants array.
     */
    private validatesRatingRange(restaurants: Restaurant[]): Restaurant[] {
        return restaurants.filter(restaurant => restaurant.rating < 0 || restaurant.rating > 4)
    }
}