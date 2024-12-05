import { useEffect, useRef, useState } from 'react'
import {
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native'
import { FlatList, Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { images } from './assests/images/localImages'
import FlipCard from 'react-native-flip-card'
// const tarodCardImg = `https://user-images.githubusercontent.com/2805320/245194123-d1fc79fd-c8e1-48a8-b229-59b3f3ec04fb.jpg`
const tarodCardImg = `https://img.freepik.com/free-vector/hand-drawn-esoteric-pattern-design_23-2149346196.jpg?size=500&ext=jpg`
const selectedCardImg = `https://cdn.pixabay.com/photo/2024/02/15/13/55/ai-generated-8575453_1280.png`; // Placeholder for the selected card image
const flippedCardImg = require("./assests/images/1.webp"); // Placeholder for the selected card image
const { width, height } = Dimensions.get('window')

const numberOfCards = 20

const minSize = 120    // _size of the tarot card
const tarotCardSize = {
  width: minSize,   //_size
  height: minSize * 1.67,
  borderRadius: 12,
}
const tarotCards = [...Array(numberOfCards).keys()].map((i) => ({
  key: `tarot-card-${i}`,
  uri: tarodCardImg,
  flippedUri: images[i + 1],
}))

const TWO_PI = 2 * Math.PI
//Each card angle { rotation for each individual card }
const theta = TWO_PI / numberOfCards;
const dynamicFontSize = (size) => {
  return size * (width / 375); // Assuming 375 is the base width for scaling
}

const dynamicWheel = (size) => {
  return size * (width / width * 2.7); // Assuming 375 is the base width for scaling
}
const tarotCardSizeVisiblePercentage = 0.9
const tarotCardSizeOnCircle = tarotCardSizeVisiblePercentage * tarotCardSize.width
const circleRadius = Math.max(
  (tarotCardSizeOnCircle * numberOfCards) / TWO_PI,
  width,
)
const circleCircumference = TWO_PI * circleRadius

const cardCoordinates = (index) => {
  return {
    x: Math.cos(theta) * index * circleRadius,
    y: Math.sin(theta) * index * circleRadius,
  }
}
const changeFactor = circleCircumference / width

function TarotCard({
  card,
  cardIndex,
  index,
  onCardClick,
  isFlipped,
}) {
  const mounted = useSharedValue(0)
  // const flipAnimation = useSharedValue(0)
  // const [isFlippedLocal, setIsFlippedLocal] = useState(false)

  useEffect(() => {
    mounted.value = withTiming(1, { duration: 500 })
  }, [])

  // useEffect(() => {
  //   if (isFlippedLocal) {
  //     flipAnimation.value = withTiming(180, { duration: 800 })
  //   }
  // }, [isFlippedLocal])

  const stylez = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(
            mounted.value,
            [0, 1],
            [0, theta * cardIndex],
          )}rad`,
        },
        {
          translateY: interpolate(
            index.value,
            [cardIndex - 1, cardIndex, cardIndex + 1],
            [0, -tarotCardSize.height / 2, 0],
            Extrapolate.CLAMP,
          ),
        },
        // { perspective: 1000 },
        // { rotateY: `${flipAnimation.value}deg` }
      ],
    }
  })



  return (
    <Animated.View
      style={[
        {
          width: tarotCardSize.width,
          height: circleRadius * 2,
          position: 'absolute',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 4,
        },
        stylez,
      ]}
    >
      {/* <TouchableOpacity onPress={() => { onCardClick(cardIndex); 
        // setIsFlippedLocal(true) 
        }}>
        {
        // isFlippedLocal ? <Image
        //   key={card.key}
        //   source={  card.flippedUri}
        //   style={styles.tarotCardBackImage}
        // />: 
        <Image
          key={card.key}
          source={{ uri: card.uri }}
          style={styles.tarotCardBackImage}
        />}
      </TouchableOpacity> */}

        <FlipCard
        friction={6}
        perspective={1000}
        flipHorizontal={true}
        flipVertical={false}
        flip={isFlipped}
        clickable={true}
        onFlipEnd={() => onCardClick(cardIndex)}
      >
        {/* Front Side */}
        <Image
          key={`front-${card.key}`}
          source={{ uri: card.uri }}
          style={styles.tarotCardBackImage}
        />
        {/* Back Side */}
        <Image
          key={`back-${card.key}`}
          source={card.flippedUri}
          style={styles.tarotCardBackImage}
        />
      </FlipCard>
    </Animated.View>
  )
}

function TarotWheel({
  cards,
  onCardChange,
  onCardClick,
  isFlipped,
  isWheelDisabled,
}) {
  const distance = useSharedValue(0)
  const angle = useDerivedValue(() => {
    return distance.value / circleCircumference
  })
  const interpolatedIndex = useDerivedValue(() => {
    const x = Math.abs((angle.value % TWO_PI) / theta)
    return angle.value < 0 ? x : numberOfCards - x
  })
  const activeIndex = useDerivedValue(() => {
    return Math.round(interpolatedIndex.value)
  })

  const pan = Gesture.Pan().onChange((ev) => {
    if (!isWheelDisabled) {
      distance.value += ev.changeX * changeFactor
    }
  }).onFinalize((ev) => {
    if (!isWheelDisabled) {
      distance.value = withDecay(
        {
          velocity: ev.velocityX,
          velocityFactor: changeFactor,
        },
        () => {
          const newAngleFloat = -interpolatedIndex.value * theta
          const newAngle = -activeIndex.value * theta
          distance.value = newAngleFloat * circleCircumference
          distance.value = withSpring(newAngle * circleCircumference)
          runOnJS(onCardChange)(activeIndex.value)
        },
      )
    }
  })

  const stylez = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${angle.value}rad`,
        },
      ],
    }
  })

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          {
            width: circleRadius * 2,
            height: circleRadius * 2,
            borderRadius: circleRadius,
            position: 'absolute',
            justifyContent: 'center',
            alignItems: 'center',
            alignSelf: 'center',
            top: height - tarotCardSize.height * 2,
          },
          stylez,
        ]}
      >
        {cards.map((card, cardIndex) => {
          return (
            <TarotCard
              card={card}
              key={card.key}
              index={interpolatedIndex}
              cardIndex={cardIndex}
              onCardClick={onCardClick}
              isFlipped={isFlipped && cardIndex === activeIndex.value}
            />
          )
        })}
      </Animated.View>
    </GestureDetector>
  )
}

export function TarotCards() {
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isWheelDisabled, setIsWheelDisabled] = useState(false)
  const [selectedCards, setSelectedCards] = useState([])
  const [showFinalCards, setShowFinalCards] = useState(false);

  const resetAll = () => {
    setActiveCardIndex(0)
    setIsFlipped(false)
    setIsWheelDisabled(false)
    setSelectedCards([])
    setShowFinalCards(false)
  }

  const handleCardClick = (cardIndex) => {
    if (cardIndex === activeCardIndex) {

      setTimeout(() => {
        setIsFlipped(true);
        setIsWheelDisabled(true)
        setSelectedCards((prevSelectedCards) => {
          const newSelectedCards = [...prevSelectedCards, tarotCards[cardIndex]]
          if (newSelectedCards.length === 3) {
            setTimeout(() => {
              //   handleShowSelectedCards(newSelectedCards)
              setShowFinalCards(true);
            }, 3000)
          } else {
            setTimeout(() => {
              handleWheelRefresh()
            }, 3000)
          }
          return newSelectedCards
        })
      }, 1500)
    }
  }

  const handleWheelRefresh = () => {
    setActiveCardIndex(0)
    setIsFlipped(false)
    setIsWheelDisabled(false)
  }

  const handleShowSelectedCards = (cards) => {
    // Show the selected cards
    console.log('Selected Cards:', cards)
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#164aa1',
        }}
      >
        <StatusBar hidden />

        {isFlipped && !showFinalCards && (
          <View style={styles.selectedCardContainer}>
            <Image
              source={tarotCards[activeCardIndex].flippedUri}
              style={styles.selectedCard}
            />
            <Text style={styles.selectedCardText}>
              You have selected {tarotCards[activeCardIndex].key}
            </Text>
          </View>
        )}

        {!isFlipped && (
          <>
            <Text style={styles.pickCardText}>Tap to pick your {selectedCards.length + 1}{selectedCards.length == 0 ? "st" : selectedCards.length == 1 ? "nd" : "rd"} card</Text>
            <TarotWheel
              cards={tarotCards}
              onCardChange={(cardIndex) => setActiveCardIndex(cardIndex)}
              onCardClick={activeCardIndex == null ? () => { } : handleCardClick}
              isFlipped={isFlipped}
              isWheelDisabled={isWheelDisabled}
            />
          </>
        )}

        {showFinalCards && (
          <>
            <TouchableOpacity onPress={resetAll}>
              <Text style={styles.refreshText}>Reset All</Text>
            </TouchableOpacity>
            <Text style={styles.selectedCardsTitle}>Selected Cards:</Text>
            <View style={styles.selectedCardsContainer}>

              {selectedCards.map((card, index) => (
                <View key={card.key} style={styles.selectedCardItem}>
                  <Image source={card.flippedUri} style={styles.threeSelectedCard} />
                  <Text numberOfLines={2} style={styles.selectedCardTextFinal}>{card.key}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </GestureHandlerRootView>
  )
}



const styles = StyleSheet.create({
  tarotCardBackImage: {
    width: tarotCardSize.width,
    height: tarotCardSize.height * 0.8,
    borderRadius: tarotCardSize.borderRadius,
    resizeMode: 'repeat',
    borderWidth: 4,
    borderColor: 'white',
  },
  selectedCardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCard: {
    width: width * 0.8,
    height: height * 0.5,
    borderRadius: tarotCardSize.borderRadius,
  },
  selectedCardText: {
    marginTop: 20,
    fontSize: dynamicFontSize(18),
    fontWeight: 'bold',
    color: 'white',
    marginHorizontal: 10,
  },
  selectedCardTextFinal: {
    marginTop: dynamicFontSize(20),
    fontSize: dynamicFontSize(18),
    fontWeight: 'bold',
    color: 'white',
    marginHorizontal: 10,

  },
  refreshText: {
    marginBottom: dynamicFontSize(80),
    fontSize: dynamicFontSize(16),
    color: 'white',
  },
  selectedCardsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: width * 0.95,
  },
  selectedCardsTitle: {
    fontSize: dynamicFontSize(20),
    fontWeight: 'bold',
    color: 'white',
  },
  selectedCardItem: {
    alignItems: 'center',
    marginTop: 10,

  },
  threeSelectedCard: {
    width: width * 0.2,
    height: 167,
    borderRadius: tarotCardSize.borderRadius,
  },
  pickCardText: {
    fontSize: dynamicFontSize(20),
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 300,
  }
})

