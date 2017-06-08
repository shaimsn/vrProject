function randFilter = genNonMinPhaseFilt(numFactors, range_r)
%GENNONMINPHASEFILT Generate Some Random Filter
%   numFactors -- Number of 2nd order factor in FIR filter
%   range_r -- Range of Radii for the Location of Zeros
%   randFilter -- Randomly Generated Filter

factor2ndOrder = @(r, t) [1, -2*r*cos(t), r^2];
rs = abs(diff(range_r))*rand(1, numFactors)+min(range_r); 
ts = pi*rand(1, numFactors); randFilter = 1;

for k = 1:numFactors
    randFilter = conv(randFilter, factor2ndOrder(rs(k), ts(k)) );
end

randFilter = randFilter / std(randFilter);

end

