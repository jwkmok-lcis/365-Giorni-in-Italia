// shops.js – shop menus and rotating greetings for café / bakery NPCs.
// Shops sell food/drinks that restore energy. Buying triggers a mini lesson.

export const SHOP_ITEMS = {
  caffe_bologna: [
    { id: "espresso",    label: "Espresso",           price: 3,  energy: 2, it: "Un espresso, per favore.",        en: "An espresso, please." },
    { id: "cappuccino",  label: "Cappuccino",         price: 5,  energy: 3, it: "Un cappuccino, grazie.",          en: "A cappuccino, thanks." },
    { id: "cornetto",    label: "Cornetto con crema", price: 4,  energy: 2, it: "Un cornetto con la crema.",       en: "A cream-filled croissant." },
  ],
  panetteria_rossi: [
    { id: "pane_comune",  label: "Pane comune",       price: 2,  energy: 1, it: "Del pane comune, per favore.",    en: "Some plain bread, please." },
    { id: "focaccia",     label: "Focaccia",          price: 4,  energy: 2, it: "Una focaccia, grazie.",           en: "A focaccia, thanks." },
    { id: "panino",       label: "Panino al prosciutto", price: 6, energy: 3, it: "Un panino al prosciutto.",      en: "A ham sandwich." },
  ],
};

// Rotating greetings — the shopkeeper cycles through these. Each has Italian + English.
export const SHOP_GREETINGS = {
  barista_giulia: [
    { it: "Buongiorno! Cosa prendi oggi?",               en: "Good morning! What'll you have today?" },
    { it: "Ciao! Il solito espresso?",                    en: "Hi! The usual espresso?" },
    { it: "Bentornato! Un caffè per ricaricare?",         en: "Welcome back! A coffee to recharge?" },
    { it: "Ehilà! Serve qualcosa di caldo?",              en: "Hey there! Need something warm?" },
    { it: "Ah, sei tu! Come stai oggi?",                  en: "Ah, it's you! How are you today?" },
    { it: "Buon pomeriggio! Vuoi un cappuccino?",         en: "Good afternoon! Want a cappuccino?" },
    { it: "Eccoti! Pronto per un caffè?",                 en: "There you are! Ready for a coffee?" },
    { it: "Ciao caro! Cosa ti preparo?",                  en: "Hi dear! What can I make you?" },
    { it: "Buonasera! Un cornetto fresco?",               en: "Good evening! A fresh croissant?" },
    { it: "Ciao! C'è qualcosa che ti tenta?",             en: "Hi! Is there something that tempts you?" },
  ],
  panettiere_paolo: [
    { it: "Buongiorno! Il pane è freschissimo oggi.",     en: "Good morning! The bread is super fresh today." },
    { it: "Ciao! Vuoi assaggiare la focaccia?",           en: "Hi! Want to try the focaccia?" },
    { it: "Ah, ciao! Hai fame?",                          en: "Ah, hi! Are you hungry?" },
    { it: "Bentornato! La panetteria è il posto giusto.",  en: "Welcome back! The bakery's the right place." },
    { it: "Oggi ho fatto il pane con le olive.",           en: "Today I made olive bread." },
    { it: "Buon pomeriggio! Serve qualcosa?",              en: "Good afternoon! Need anything?" },
    { it: "Ciao amico! Il forno è ancora caldo!",          en: "Hi friend! The oven is still warm!" },
    { it: "Eccoti! Ho appena sfornato la focaccia.",       en: "There you are! I just baked the focaccia." },
    { it: "Buonasera! Un panino per la strada?",           en: "Good evening! A sandwich for the road?" },
    { it: "Ciao! Senti che profumo di pane?",              en: "Hi! Can you smell the bread?" },
  ],
};

// After-purchase reactions (rotate)
export const SHOP_THANKS = {
  barista_giulia: [
    { it: "Ecco a te! Buona giornata.",                    en: "Here you go! Have a great day." },
    { it: "Perfetto. Torna quando vuoi!",                  en: "Perfect. Come back anytime!" },
    { it: "Grazie! Con questo caffè vai lontano.",         en: "Thanks! This coffee will take you far." },
  ],
  panettiere_paolo: [
    { it: "Ecco il tuo pane. Buon appetito!",              en: "Here's your bread. Enjoy!" },
    { it: "Ottima scelta! Torna presto.",                   en: "Great choice! Come back soon." },
    { it: "Grazie! Il pane fresco fa bene all'anima.",      en: "Thanks! Fresh bread is good for the soul." },
  ],
};

// Rejection when player can't afford
export const SHOP_NO_MONEY = {
  barista_giulia: [
    { it: "Mi dispiace, non hai abbastanza soldi.",          en: "I'm sorry, you don't have enough money." },
    { it: "Torna quando hai qualche moneta in più.",          en: "Come back when you have a few more coins." },
  ],
  panettiere_paolo: [
    { it: "Il pane costa qualcosa, purtroppo.",              en: "Bread does cost something, unfortunately." },
    { it: "Non hai soldi? Prova a fare qualcos'altro prima.", en: "No money? Try doing something else first." },
  ],
};
