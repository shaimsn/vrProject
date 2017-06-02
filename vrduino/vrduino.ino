/**
 * EE267 Virtual Reality
 * Homework 5
 * Inertial Measurement Units and Sensor Fusion
 *
 * Instructor: Gordon Wetzstein <gordon.wetzstein@stanford.edu>,
 *         Robert Konrad <rkkonrad@stanford.edu>,
 *         Hayato Ikoma <hikoma@stanford.edu>,
 *         Keenan Molner <kmolner@stanford.edu>
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @author Gordon Wetzstein <gordon.wetzstein@stanford.edu>,
 * @copyright The Board of Trustees of the Leland
   Stanford Junior University
 * @version 2017/03/28
 *
 */


/* Our IMU class */
#include "imu.h"

/* Our Quaternion class */
#include "Quaternion.h"

/* Our Euler class */
#include "Euler.h"

/***
 * Variable to set if the measureBias function will be executed. If the bias
 * measurement is executed, the estiamted values will be used for the
 * orientation tracking. If not, the default values of gyrBias will be used.
 */
const bool findBias = false;


/* Measured bias */
double gyrBiasX = 3.36259, gyrBiasY = -0.350597, gyrBiasZ = 0.831812;
double accBiasX = 0.65, accBiasY = -1.81, accBiasZ = 9.60;
double magBiasX = 36.47, magBiasY = 2.84, magBiasZ = -26.17;


/* Integrated gyroscope measurements */
double gyrIntX = 0, gyrIntY = 0, gyrIntZ = 0;

/* Constant for complementary filter */
const double alpha = 0.9;

/* Variables for timing measurements */
double previous_time = 0;


/* Variables for streaming data (euler and quaternion based on complementary
   filter) */
Euler eulerCmp  = Euler();
Quaternion qCmp = Quaternion();


/***
 * Imu class instance
 * This class is used to read the measurements.
 */
Imu imu = Imu();


/***
 * Helper function and variables to stream data
 * Change the variable streamingMode to switch which variables you would like
 * to stream into the serial communication.
 *
 * Feel free to add other data for debugging.
 */
const int NONE       = 0;
const int EULER      = 1;
const int QUATERNION = 2;
const int GYR        = 3;
const int ACC        = 4;
const int MAG        = 5;
const int GYRINT     = 6;

int streamingMode = QUATERNION;

void streamData() {
  switch (streamingMode) {
  case NONE:
    break;

  case EULER:
    Serial.printf("EC %f %f %f\n",
                  eulerCmp.pitch, eulerCmp.yaw, eulerCmp.roll);
    break;

  case QUATERNION:
    Serial.printf("QC %f %f %f %f\n",
                  qCmp.q[0], qCmp.q[1], qCmp.q[2], qCmp.q[3]);
    break;

  case GYR:
    Serial.printf("GYR %f %f %f\n", imu.gyrX, imu.gyrY, imu.gyrZ);
    break;

  case ACC:
    Serial.printf("ACC %f %f %f\n", imu.accX, imu.accY, imu.accZ);
    break;

  case MAG:
    Serial.printf("MAG %f %f %f\n", imu.magX, imu.magY, imu.magZ);
    break;

  case GYRINT:
    Serial.printf("GYRINT %f %f %f\n", gyrIntX, gyrIntY, gyrIntZ);
    break;
  }
}

/* Helper function to get the sign of a value */
double sign(double value) {
  return double((value > 0) - (value < 0));
}

/**
 * This function is used to measure the bias and variance of the measurements.
 * The estimation is performed by taking 1000 measurements. This function should
 * be executed by placing Arduino stedy.
 */
void measureBias() {
  gyrBiasX = 0, gyrBiasY = 0, gyrBiasZ = 0;
  accBiasX = 0, accBiasY = 0, accBiasZ = 0;
  magBiasX = 0, magBiasY = 0, magBiasZ = 0;

  double gyrVarX = 0, gyrVarY = 0, gyrVarZ = 0;
  double accVarX = 0, accVarY = 0, accVarZ = 0;
  double magVarX = 0, magVarY = 0, magVarZ = 0;

  /* Number of measurements */
  int N = 1000;

  /* Find the mean of measurements */
  for (int i = 0; i < N; ++i) {
    /* read IMU data */
    imu.read();

    gyrBiasX += imu.gyrX / N;
    gyrBiasY += imu.gyrY / N;
    gyrBiasZ += imu.gyrZ / N;

    accBiasX += imu.accX / N;
    accBiasY += imu.accY / N;
    accBiasZ += imu.accZ / N;

    magBiasX += imu.magX / N;
    magBiasY += imu.magY / N;
    magBiasZ += imu.magZ / N;
  }

  /* Find the variance of measurements */
  for (int i = 0; i < N; ++i) {
    /* read IMU data */
    imu.read();

    gyrVarX += sq(imu.gyrX - gyrBiasX) / N;
    gyrVarY += sq(imu.gyrY - gyrBiasY) / N;
    gyrVarZ += sq(imu.gyrZ - gyrBiasZ) / N;

    accVarX += sq(imu.accX - accBiasX) / N;
    accVarY += sq(imu.accY - accBiasY) / N;
    accVarZ += sq(imu.accZ - accBiasZ) / N;

    magVarX += sq(imu.magX - magBiasX) / N;
    magVarY += sq(imu.magY - magBiasY) / N;
    magVarZ += sq(imu.magZ - magBiasZ) / N;
  }

  Serial.printf("X bias: g: %f, m: %f, a: %f\n",
                gyrBiasX, magBiasX, accBiasX);
  Serial.printf("Y bias: g: %f, m: %f, a: %f\n",
                gyrBiasY, magBiasY, accBiasY);
  Serial.printf("Z bias: g: %f, m: %f, a: %f\n",
                gyrBiasZ, magBiasZ, accBiasZ);

  Serial.printf("X variance: g: %f, m: %f, a: %f\n",
                gyrVarX, magVarX, accVarX);
  Serial.printf("Y variance: g: %f, m: %f, a: %f\n",
                gyrVarY, magVarY, accVarY);
  Serial.printf("Z variance: g: %f, m: %f, a: %f\n",
                gyrVarZ, magVarZ, accVarZ);
}

/* Set up Arduino */
void setup() {
  /* Initialize serial communication */
  delay(1000);
  Serial.begin(115200);
  delay(100);
  Serial.println("Serial communication started...");
  delay(1000);

  /* initialize IMU */
  imu.init();

  if (imu.communication) {
    Serial.print("Valid communication with IMU!\n\n");
  } else {
    Serial.print("Invalid communicaiton with IMU...\n\n");
  }


  /* Measure bias */
  if (findBias) measureBias();
  delay(1000);
}

/* Main loop, read and display data */
void loop() {
  /* Reset the estimation if there is a keyboard input. */
  if (Serial.available()) {
    streamingMode = Serial.parseInt();

    gyrIntX = 0;
    gyrIntY = 0;
    gyrIntZ = 0;

    eulerCmp = Euler();

    qCmp = Quaternion();
  }

  /* Get current time in milliseconds */
  double current_time = millis();

  if (previous_time == 0) {
    previous_time = current_time;
  }

  /* Compute the elapsed time from the previous iteration */
  double deltaT = (current_time - previous_time) / 1000.0;
  previous_time = current_time;

  /* read IMU data */
  imu.read();

  /* remove bias from the gyro measurements */
  double gyrX = imu.gyrX - gyrBiasX;
  double gyrY = imu.gyrY - gyrBiasY;
  double gyrZ = imu.gyrZ - gyrBiasZ;

  /* Integrate gyroscope measurements */
  gyrIntX += deltaT * gyrX;
  gyrIntY += deltaT * gyrY;
  gyrIntZ += deltaT * gyrZ;

  /* Use Euler angle to compute the angle  */
  if (streamingMode == EULER) {
    /* Compute pitch and yaw from the accelerometer measurements */
    double pitchAcc =
      -atan2(imu.accZ,
             sign(imu.accY) * sqrt(sq(imu.accX) + sq(imu.accY))) * RAD_TO_DEG;

    double rollAcc = -atan2(-imu.accX, imu.accY) * RAD_TO_DEG;

    /* Apply complementary filter */
    eulerCmp.pitch = alpha * (eulerCmp.pitch + deltaT * gyrX)
                     + (1 - alpha) * pitchAcc;

    eulerCmp.yaw += deltaT * gyrY;

    eulerCmp.roll = alpha * (eulerCmp.roll + deltaT * gyrZ)
                    + (1 - alpha) * rollAcc;
  }

  /* Use quaternion to comptue the angle */
  else if (streamingMode == QUATERNION) {
    double l = sqrt(sq(gyrX) + sq(gyrY) + sq(gyrZ));

    Quaternion qDelta = Quaternion();

    if (l >= 1e-8) {
      qDelta.setFromAngleAxis(
        deltaT * l, gyrX / l, gyrY / l, gyrZ / l);
    }


    /* compute quaternion representing tilt of sensor */
    qCmp = Quaternion().multiply(qCmp, qDelta).normalize();

    /* compute complementary filter */
    Quaternion qa = Quaternion(0, imu.accX, imu.accY, imu.accZ);

    Quaternion qa_inertial = qa.rotate(qCmp);

    double phi = acos(qa_inertial.q[2] / qa_inertial.length()) * RAD_TO_DEG;

    double n = sqrt(sq(qa_inertial.q[1]) + sq(qa_inertial.q[3]));

    Quaternion qTilt = Quaternion().setFromAngleAxis(
      (1 - alpha) * phi, -qa_inertial.q[3] / n, 0.0, qa_inertial.q[1] / n);

    qCmp = Quaternion().multiply(qTilt, qCmp).normalize();
  }

  streamData();
}
