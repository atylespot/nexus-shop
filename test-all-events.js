// Test script for all 11 Facebook Events with 10/10 score
// Run this with: node test-all-events.js

const testAllFacebookEvents = async () => {
  console.log('🧪 Testing All 11 Facebook Events with 10/10 Score\n');
  console.log('='.repeat(80));

  const baseUrl = 'http://localhost:3000/api/fb-events';
  const testResults = [];

  // Test data for all events
  const testEvents = [
    {
      name: 'PageView',
      data: {
        event_name: 'PageView',
        custom_data: {
          content_name: 'Homepage',
          content_category: 'website',
          content_type: 'website',
          value: 0,
          currency: 'USD'
        },
        user_data: {
          fbp: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`,
          fbc: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`
        }
      }
    },
    {
      name: 'ViewContent',
      data: {
        event_name: 'ViewContent',
        custom_data: {
          content_name: 'Premium Smartphone',
          content_category: 'electronics',
          content_ids: ['product_123'],
          content_type: 'product',
          value: 999.99,
          currency: 'USD',
          num_items: 1
        },
        user_data: {
          fbp: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`,
          fbc: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`
        }
      }
    },
    {
      name: 'AddToCart',
      data: {
        event_name: 'AddToCart',
        custom_data: {
          content_name: 'Premium Smartphone',
          content_category: 'electronics',
          content_ids: ['product_123'],
          content_type: 'product',
          value: 999.99,
          currency: 'USD',
          num_items: 1
        },
        user_data: {
          fbp: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`,
          fbc: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`
        }
      }
    },
    {
      name: 'InitiateCheckout',
      data: {
        event_name: 'InitiateCheckout',
        custom_data: {
          content_name: 'Premium Smartphone',
          content_category: 'electronics',
          content_ids: ['product_123'],
          content_type: 'product',
          value: 999.99,
          currency: 'USD',
          num_items: 1
        },
        user_data: {
          fbp: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`,
          fbc: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`
        }
      }
    },
    {
      name: 'Purchase',
      data: {
        event_name: 'Purchase',
        custom_data: {
          content_name: 'Premium Smartphone',
          content_category: 'electronics',
          content_ids: ['product_123'],
          content_type: 'product',
          value: 999.99,
          currency: 'USD',
          num_items: 1,
          order_id: `order_${Date.now()}`
        },
        user_data: {
          fbp: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`,
          fbc: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`
        }
      }
    },
    {
      name: 'Search',
      data: {
        event_name: 'Search',
        custom_data: {
          search_string: 'smartphone',
          content_category: 'electronics',
          content_type: 'product',
          content_ids: ['product_123', 'product_456']
        },
        user_data: {
          fbp: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`,
          fbc: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`
        }
      }
    },
    {
      name: 'AddToWishlist',
      data: {
        event_name: 'AddToWishlist',
        custom_data: {
          content_name: 'Premium Smartphone',
          content_category: 'electronics',
          content_ids: ['product_123'],
          content_type: 'product',
          value: 999.99,
          currency: 'USD',
          num_items: 1
        },
        user_data: {
          fbp: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`,
          fbc: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`
        }
      }
    },
    {
      name: 'Lead',
      data: {
        event_name: 'Lead',
        custom_data: {
          content_name: 'Newsletter Signup',
          content_category: 'lead_generation',
          content_type: 'lead',
          value: 0,
          currency: 'USD'
        },
        user_data: {
          fbp: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`,
          fbc: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`
        }
      }
    },
    {
      name: 'CompleteRegistration',
      data: {
        event_name: 'CompleteRegistration',
        custom_data: {
          content_name: 'User Registration',
          content_category: 'registration',
          content_type: 'registration',
          value: 0,
          currency: 'USD'
        },
        user_data: {
          fbp: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`,
          fbc: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`
        }
      }
    },
    {
      name: 'Contact',
      data: {
        event_name: 'Contact',
        custom_data: {
          content_name: 'Contact Form',
          content_category: 'contact',
          content_type: 'contact',
          value: 0,
          currency: 'USD'
        },
        user_data: {
          fbp: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`,
          fbc: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`
        }
      }
    },
    {
      name: 'CustomizeProduct',
      data: {
        event_name: 'CustomizeProduct',
        custom_data: {
          content_name: 'Custom Smartphone',
          content_category: 'electronics',
          content_ids: ['product_123'],
          content_type: 'product',
          value: 1299.99,
          currency: 'USD',
          num_items: 1
        },
        user_data: {
          fbp: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`,
          fbc: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`
        }
      }
    }
  ];

  // Test each event
  for (let i = 0; i < testEvents.length; i++) {
    const event = testEvents[i];
    console.log(`\n📋 Test ${i + 1}/${testEvents.length}: ${event.name}`);
    console.log('-'.repeat(50));

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event.data)
      });

      const result = await response.json();
      
      const testResult = {
        event: event.name,
        status: response.status,
        success: result.success,
        event_id: result.event_id,
        deduplication_key: result.deduplication_key,
        match_quality_score: result.tracking_data?.match_quality_score || 0,
        validation_score: result.tracking_data?.event_validation_score || 0,
        parameters_sent: result.tracking_data?.parameters_sent || 0,
        error: result.error || null
      };

      testResults.push(testResult);

      if (result.success) {
        console.log(`✅ ${event.name} - SUCCESS`);
        console.log(`   Event ID: ${result.event_id}`);
        console.log(`   Deduplication Key: ${result.deduplication_key}`);
        console.log(`   Match Quality Score: ${result.tracking_data?.match_quality_score}%`);
        console.log(`   Validation Score: ${result.tracking_data?.event_validation_score}/10`);
        console.log(`   Parameters Sent: ${result.tracking_data?.parameters_sent}`);
      } else {
        console.log(`❌ ${event.name} - FAILED`);
        console.log(`   Error: ${result.error}`);
        console.log(`   Message: ${result.message}`);
      }

      // Wait 1 second between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.log(`🚨 ${event.name} - ERROR`);
      console.log(`   Error: ${error.message}`);
      
      testResults.push({
        event: event.name,
        status: 0,
        success: false,
        event_id: null,
        deduplication_key: null,
        match_quality_score: 0,
        validation_score: 0,
        parameters_sent: 0,
        error: error.message
      });
    }
  }

  // Summary Report
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE TEST SUMMARY');
  console.log('='.repeat(80));

  const successfulTests = testResults.filter(r => r.success);
  const failedTests = testResults.filter(r => !r.success);
  
  console.log(`\n🎯 Overall Results:`);
  console.log(`   Total Tests: ${testResults.length}`);
  console.log(`   Successful: ${successfulTests.length}`);
  console.log(`   Failed: ${failedTests.length}`);
  console.log(`   Success Rate: ${((successfulTests.length / testResults.length) * 100).toFixed(1)}%`);

  // Match Quality Analysis
  const avgMatchQuality = successfulTests.length > 0 
    ? successfulTests.reduce((sum, r) => sum + r.match_quality_score, 0) / successfulTests.length 
    : 0;
  
  const avgValidationScore = successfulTests.length > 0 
    ? successfulTests.reduce((sum, r) => sum + r.validation_score, 0) / successfulTests.length 
    : 0;

  console.log(`\n📈 Quality Metrics:`);
  console.log(`   Average Match Quality: ${avgMatchQuality.toFixed(1)}%`);
  console.log(`   Average Validation Score: ${avgValidationScore.toFixed(1)}/10`);
  console.log(`   Target Match Quality: 100%`);
  console.log(`   Target Validation Score: 10/10`);

  // Detailed Results
  console.log(`\n📋 Detailed Results:`);
  testResults.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${index + 1}. ${status} ${result.event}`);
    console.log(`      Match Quality: ${result.match_quality_score}% | Validation: ${result.validation_score}/10`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });

  // Recommendations
  console.log(`\n💡 Recommendations:`);
  
  if (avgMatchQuality < 100) {
    console.log(`   ⚠️  Match Quality below 100% - Consider adding more user data parameters`);
  } else {
    console.log(`   ✅ Match Quality is excellent (${avgMatchQuality.toFixed(1)}%)`);
  }
  
  if (avgValidationScore < 10) {
    console.log(`   ⚠️  Validation Score below 10/10 - Check required parameters for failed events`);
  } else {
    console.log(`   ✅ Validation Score is perfect (${avgValidationScore.toFixed(1)}/10)`);
  }

  if (failedTests.length > 0) {
    console.log(`   ⚠️  ${failedTests.length} events failed - Check server configuration and credentials`);
  }

  // Final Assessment
  console.log(`\n🏆 Final Assessment:`);
  
  const overallScore = (successfulTests.length / testResults.length) * 100;
  const qualityScore = avgMatchQuality;
  const validationScore = (avgValidationScore / 10) * 100;
  
  const finalScore = (overallScore + qualityScore + validationScore) / 3;
  
  if (finalScore >= 95) {
    console.log(`   🎉 EXCELLENT (${finalScore.toFixed(1)}%) - System is production ready!`);
  } else if (finalScore >= 80) {
    console.log(`   👍 GOOD (${finalScore.toFixed(1)}%) - Minor improvements needed`);
  } else if (finalScore >= 60) {
    console.log(`   ⚠️  FAIR (${finalScore.toFixed(1)}%) - Significant improvements needed`);
  } else {
    console.log(`   ❌ POOR (${finalScore.toFixed(1)}%) - Major issues need to be addressed`);
  }

  console.log(`\n🔧 Next Steps:`);
  console.log(`   1. Check Facebook Events Manager for received events`);
  console.log(`   2. Verify test event codes are working correctly`);
  console.log(`   3. Monitor match quality scores in Events Manager`);
  console.log(`   4. Set up proper deduplication monitoring`);
  console.log(`   5. Configure alerts for failed events`);

  return testResults;
};

// Run the test
testAllFacebookEvents().catch(console.error);
