import { Restaurant, RestaurantDB } from "../models/restaurant";

export class RestaurantMapper {
    /**
     * Mapps from database model to js model.
     *
     * @param restaurantDB Object obtained directly from DB.
     */
    public static fromDbToModel(restaurantDB: RestaurantDB): Restaurant {
        let restaurant: Restaurant = new Restaurant();

        restaurant.id = restaurantDB.ID_RESTAURANT;
        restaurant.rating = restaurantDB.NU_RATING;
        restaurant.name = restaurantDB.DS_NAME;
        restaurant.site = restaurantDB.DS_SITE;
        restaurant.email = restaurantDB.DS_EMAIL;
        restaurant.phone = restaurantDB.DS_PHONE;
        restaurant.street = restaurantDB.DS_STREET;
        restaurant.city = restaurantDB.DS_CITY;
        restaurant.state = restaurantDB.DS_STATE;
        restaurant.lat = restaurantDB.FL_LAT;
        restaurant.lng = restaurantDB.FL_LNG;

        return restaurant;
    }

    /**
     * Returns a created restaurant.
     *
     * @param restaurant Restaurant object.
     */
    public static fromObjToModel(restaurant: Restaurant): Restaurant {
        let newRestaurant: Restaurant = new Restaurant();

        newRestaurant.id = restaurant.id;
        newRestaurant.rating = restaurant.rating;
        newRestaurant.name = restaurant.name;
        newRestaurant.site = restaurant.site;
        newRestaurant.email = restaurant.email;
        newRestaurant.phone = restaurant.phone;
        newRestaurant.street = restaurant.street;
        newRestaurant.city = restaurant.city;
        newRestaurant.state = restaurant.state;
        newRestaurant.lat = restaurant.lat;
        newRestaurant.lng = restaurant.lng;

        return newRestaurant;
    }
}